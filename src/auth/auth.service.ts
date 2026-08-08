import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappBlastService } from '../whatsapp-blast/whatsapp-blast.service';
import { normalizeToWaJid } from '../whatsapp-blast/helpers/phone.helper';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

export interface TokenPayload {
  sub: string;
  username: string;
  email: string;
  roleId: string;
  type: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface JwtPayload {
  sub: string;
  username: string;
  email: string;
  roleId: string;
  iat?: number;
  exp?: number;
  type?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  // --- Forgot-password (WhatsApp OTP) tuning ---
  private static readonly OTP_TTL_MS = 10 * 60_000; // 10 menit
  private static readonly MAX_VERIFY_ATTEMPTS = 5;
  private static readonly THROTTLE_WINDOW_MS = 15 * 60_000; // 15 menit
  private static readonly THROTTLE_MAX = 3; // max 3 request / window per unit|phone
  private static readonly RESEND_COOLDOWN_MS = 60_000; // min 60 detik antar kirim per user
  /** Best-effort request throttle (stateless; resets on restart). */
  private readonly requestThrottle = new Map<string, number[]>();

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly whatsappBlastService: WhatsappBlastService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.usersService.findByUsername(username, {
      role: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
    });

    if (!user) {
      return null;
    }

    if (!user.password) {
      return null;
    }

    try {
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return null;
      }
    } catch (error) {
      this.logger.warn(`Invalid password hash for user ${username}`);
      return null;
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const { password: _, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto): Promise<AuthTokens & { user: any }> {
    const user = await this.validateUser(loginDto.username, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user);

    // Update refresh token and last login
    await this.usersService.update(user.id, {
      refreshToken: tokens.refreshToken,
      refreshTokenExpiry: this.getRefreshTokenExpiryDate(),
      lastLoginAt: new Date(),
    });

    this.logger.log(`User logged in: ${user.username}`);

    return {
      ...tokens,
      user: this.buildUserResponse(user),
    };
  }

  async register(registerDto: RegisterDto): Promise<AuthTokens & { user: any }> {
    // Check if user already exists
    const existingUser = await this.usersService.findByUsername(registerDto.username);
    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    const existingEmail = await this.usersService.findByEmail(registerDto.email);
    if (existingEmail) {
      throw new ConflictException('Email already exists');
    }

    // Password hashing is handled centrally by UsersService.create
    const user = await this.usersService.create({
      ...registerDto,
      roleId: registerDto.roleId || this.configService.get<string>('DEFAULT_USER_ROLE_ID', 'default-user-role'),
      isActive: true,
      isEmailVerified: false,
    });

    // Fetch user with role for response
    const userWithRole = await this.usersService.findById(user.id, {
      role: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(userWithRole);

    this.logger.log(`New user registered: ${user.username}`);

    return {
      ...tokens,
      user: this.buildUserResponse(userWithRole),
    };
  }

  /**
   * Get the authenticated user's profile, shaped consistently with login.
   */
  async getMe(userId: string) {
    const user = await this.usersService.findById(userId, {
      role: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.buildUserResponse(user);
  }

  /**
   * Shape the authenticated user object consistently across login, register,
   * and /auth/me so all three return the same `user` structure.
   */
  private buildUserResponse(user: any) {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roleId: user.roleId,
      role: user.role
        ? {
            id: user.role.id,
            name: user.role.name,
            description: user.role.description,
          }
        : null,
    };
  }

  async refreshTokens(refreshTokenDto: RefreshTokenDto): Promise<AuthTokens> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(
        refreshTokenDto.refreshToken,
        {
          // Token refresh ditandatangani pakai jwt.refreshSecret (lihat generateTokens),
          // jadi verify-nya juga harus pakai secret yang sama — bukan default access secret.
          secret:
            this.configService.get<string>('jwt.refreshSecret') ||
            'default-refresh-secret',
        },
      );

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      const user = await this.usersService.findById(payload.sub);

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      if (user.refreshToken !== refreshTokenDto.refreshToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const expiryDate = user.refreshTokenExpiry
        ? new Date(user.refreshTokenExpiry)
        : null;
      if (expiryDate && expiryDate < new Date()) {
        throw new UnauthorizedException('Refresh token expired');
      }

      if (!user.isActive) {
        throw new UnauthorizedException('Account is deactivated');
      }

      const tokens = await this.generateTokens(user);

      // Update refresh token
      await this.usersService.update(user.id, {
        refreshToken: tokens.refreshToken,
        refreshTokenExpiry: this.getRefreshTokenExpiryDate(),
      });

      return tokens;
    } catch (error) {
      this.logger.error('Refresh token error:', error);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.update(userId, {
      refreshToken: null,
      refreshTokenExpiry: null,
    });

    this.logger.log(`User logged out: ${userId}`);
  }

  /**
   * Self-service password change. Verifies the current password before
   * accepting the new one, and rejects no-op changes (new === current).
   * The caller is the authenticated user — proof of ownership is required,
   * unlike the admin-only reset flow.
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const isCurrentValid = await this.usersService.verifyPassword(
      userId,
      currentPassword,
    );
    if (!isCurrentValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    if (currentPassword === newPassword) {
      throw new BadRequestException(
        'New password must be different from the current password',
      );
    }

    await this.usersService.updatePassword(userId, newPassword);
    this.logger.log(`Password changed by user: ${userId}`);
  }

  async verifyEmail(token: string): Promise<void> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(token);

      if (payload.type !== 'email_verification') {
        throw new BadRequestException('Invalid token type');
      }

      const user = await this.usersService.findById(payload.sub);

      if (!user) {
        throw new BadRequestException('User not found');
      }

      if (user.isEmailVerified) {
        throw new BadRequestException('Email already verified');
      }

      await this.usersService.update(user.id, {
        isEmailVerified: true,
      });

      this.logger.log(`Email verified: ${user.username}`);
    } catch (error) {
      this.logger.error('Email verification error:', error);
      throw new BadRequestException('Invalid or expired verification token');
    }
  }

  // ==========================================================================
  // Forgot password (WhatsApp OTP)
  // ==========================================================================

  /**
   * Step 1 — request a reset OTP.
   *
   * Resolves the resident matching (unit + registered WhatsApp number), issues
   * a single-use 6-digit OTP (hashed at rest) and sends it via WhatsApp. The
   * response shape is identical whether or not the account exists, to prevent
   * enumeration: an unknown unit/phone returns a dummy token + masked phone
   * and sends nothing.
   */
  async requestPasswordReset(
    unitNumber: string,
    phoneNumber: string,
  ): Promise<{ resetToken: string; maskedPhone: string }> {
    const unit = (unitNumber || '').trim();
    const phoneInput = (phoneNumber || '').trim();
    const dummy = () => ({ resetToken: crypto.randomUUID(), maskedPhone: '••••' });

    // Throttle applies regardless of account existence.
    this.checkThrottle(`${unit.toLowerCase()}|${phoneInput}`);

    const input = normalizeToWaJid(phoneInput);
    if (!input.valid) {
      this.logger.debug(`Forgot-password: nomor tidak valid "${phoneInput}"`);
      return dummy();
    }

    // Cari resident pada unit tsb yang punya akun login (userId).
    const residents = await this.prisma.resident.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        userId: { not: null },
        OR: [
          { unitNumber: unit },
          { houseUnit: { unitNumber: unit } },
          { houseUnit: { unitCode: unit } },
        ],
      },
      select: { userId: true, phoneNumber: true },
    });

    // Pilih resident yang nomor WA-nya cocok (normalisasi kedua sisi).
    const match = residents.find(
      (r) =>
        !!r.phoneNumber &&
        normalizeToWaJid(r.phoneNumber).normalized === input.normalized,
    );

    if (!match?.userId) {
      this.logger.debug(
        `Forgot-password: tidak ada match unit "${unit}" + nomor terdaftar`,
      );
      return dummy();
    }

    const userId = match.userId;

    // Cooldown: kalau baru saja kirim OTP (< 60 detik), balikin token lama tanpa resend.
    const recent = await this.prisma.passwordResetOtp.findFirst({
      where: {
        userId,
        consumed: false,
        createdAt: { gt: new Date(Date.now() - AuthService.RESEND_COOLDOWN_MS) },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (recent) {
      return {
        resetToken: recent.id,
        maskedPhone: this.maskPhone(input.normalized!),
      };
    }

    // Invalidasi OTP aktif lama user ini sebelum menerbitkan yang baru.
    await this.prisma.passwordResetOtp.updateMany({
      where: { userId, consumed: false },
      data: { consumed: true },
    });

    const code = String(crypto.randomInt(100000, 1000000));
    const row = await this.prisma.passwordResetOtp.create({
      data: {
        userId,
        otpHash: this.hashOtp(userId, code),
        expiresAt: new Date(Date.now() + AuthService.OTP_TTL_MS),
      },
    });

    // Kirim OTP via WhatsApp. Kalau WA belum terhubung, batalkan OTP & beri
    // pesan global (tidak membocorkan keberadaan akun karena berlaku semua).
    const message =
      `Kode reset password Golden Hills Anda: ${code}.\n` +
      `Berlaku 10 menit. Jangan bagikan kode ini kepada siapa pun.`;
    try {
      await this.whatsappBlastService.sendTest({
        phoneNumber: match.phoneNumber!,
        message,
      });
    } catch (error) {
      this.logger.warn(
        `Forgot-password: gagal kirim OTP WA user ${userId}: ${error?.message}`,
      );
      await this.prisma.passwordResetOtp.update({
        where: { id: row.id },
        data: { consumed: true },
      });
      throw new BadRequestException(
        'Layanan WhatsApp belum siap. Mohon coba lagi beberapa saat lagi.',
      );
    }

    this.logger.log(`Forgot-password: OTP dikirim untuk user ${userId}`);
    return {
      resetToken: row.id,
      maskedPhone: this.maskPhone(input.normalized!),
    };
  }

  /**
   * Step 2 — verify the OTP and set the new password.
   *
   * Bounded to MAX_VERIFY_ATTEMPTS wrong tries per token, after which the token
   * is consumed. On success all of the user's other active OTPs are voided.
   */
  async resetPassword(
    resetToken: string,
    otp: string,
    newPassword: string,
  ): Promise<{ success: true }> {
    const row = await this.prisma.passwordResetOtp.findUnique({
      where: { id: resetToken },
    });
    const now = new Date();

    if (!row || row.consumed || row.expiresAt < now) {
      throw new BadRequestException(
        'Kode tidak valid atau sudah kadaluarsa. Silakan minta kode baru.',
      );
    }

    const attempts = row.attempts + 1;
    if (attempts > AuthService.MAX_VERIFY_ATTEMPTS) {
      await this.prisma.passwordResetOtp.update({
        where: { id: resetToken },
        data: { consumed: true, attempts },
      });
      throw new BadRequestException(
        'Terlalu banyak percobaan salah. Silakan minta kode baru.',
      );
    }

    // Persist counter dulu agar percobaan salah tetap tercatat walau kemudian throw.
    await this.prisma.passwordResetOtp.update({
      where: { id: resetToken },
      data: { attempts },
    });

    if (this.hashOtp(row.userId, otp) !== row.otpHash) {
      throw new BadRequestException('Kode OTP salah.');
    }

    // Sukses: konsumsi token, void sibling aktif, set password baru.
    await this.prisma.passwordResetOtp.update({
      where: { id: resetToken },
      data: { consumed: true },
    });
    await this.prisma.passwordResetOtp.updateMany({
      where: { userId: row.userId, consumed: false },
      data: { consumed: true },
    });
    await this.usersService.updatePassword(row.userId, newPassword);

    // Audit (belum ada tabel audit dedicated — catat di log).
    this.logger.warn(`Password direset via OTP untuk user ${row.userId}`);

    return { success: true };
  }

  // ==========================================================================
  // Register (WhatsApp OTP) — mirror forgot-password, but creates the account
  // ==========================================================================

  /**
   * Step 1 — request a registration OTP.
   *
   * Resolves the resident matching (unit + registered WhatsApp number). Unlike
   * forgot-password this is an onboarding flow, so the outcome is explicit:
   * unknown unit / phone mismatch / already-registered each return a clear
   * error; only an unlinked, matching resident gets an OTP.
   */
  async requestRegistration(
    unitNumber: string,
    phoneNumber: string,
  ): Promise<{ registerToken: string; maskedPhone: string }> {
    const unit = (unitNumber || '').trim();
    const phoneInput = (phoneNumber || '').trim();

    // Throttle berlaku untuk semua percobaan, apa pun hasilnya.
    this.checkThrottle(`register:${unit.toLowerCase()}|${phoneInput}`);

    const input = normalizeToWaJid(phoneInput);
    if (!input.valid) {
      throw new BadRequestException('Nomor WhatsApp tidak valid.');
    }

    // Cari semua resident pada unit tsb (aktif, belum soft-delete). Tanpa filter
    // userId — register justru mencari resident yang BELUM punya akun.
    const residents = await this.prisma.resident.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        OR: [
          { unitNumber: unit },
          { houseUnit: { unitNumber: unit } },
          { houseUnit: { unitCode: unit } },
        ],
      },
      select: { id: true, userId: true, phoneNumber: true },
    });

    if (residents.length === 0) {
      throw new BadRequestException(
        'Nomor unit tidak ditemukan. Periksa kembali penulisan unit Anda.',
      );
    }

    // Pilih resident yang nomor WA-nya cocok (normalisasi kedua sisi).
    const match = residents.find(
      (r) =>
        !!r.phoneNumber &&
        normalizeToWaJid(r.phoneNumber).normalized === input.normalized,
    );

    if (!match) {
      throw new BadRequestException(
        'Nomor WhatsApp tidak cocok dengan unit ini.',
      );
    }

    if (match.userId) {
      throw new ConflictException(
        'Akun untuk unit ini sudah terdaftar. Silakan login atau gunakan fitur Lupa Password.',
      );
    }

    const residentId = match.id;

    // Cooldown: kalau baru saja kirim OTP (< 60 detik), balikin token lama.
    const recent = await this.prisma.registerOtp.findFirst({
      where: {
        residentId,
        consumed: false,
        createdAt: { gt: new Date(Date.now() - AuthService.RESEND_COOLDOWN_MS) },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (recent) {
      return {
        registerToken: recent.id,
        maskedPhone: this.maskPhone(input.normalized!),
      };
    }

    // Invalidasi OTP aktif lama resident ini sebelum menerbitkan yang baru.
    await this.prisma.registerOtp.updateMany({
      where: { residentId, consumed: false },
      data: { consumed: true },
    });

    const code = String(crypto.randomInt(100000, 1000000));
    const row = await this.prisma.registerOtp.create({
      data: {
        residentId,
        otpHash: this.hashOtp(residentId, code),
        expiresAt: new Date(Date.now() + AuthService.OTP_TTL_MS),
      },
    });

    const message =
      `Kode registrasi Golden Hills Anda: ${code}.\n` +
      `Berlaku 10 menit. Jangan bagikan kode ini kepada siapa pun.`;
    try {
      await this.whatsappBlastService.sendTest({
        phoneNumber: match.phoneNumber!,
        message,
      });
    } catch (error) {
      this.logger.warn(
        `Register: gagal kirim OTP WA resident ${residentId}: ${error?.message}`,
      );
      await this.prisma.registerOtp.update({
        where: { id: row.id },
        data: { consumed: true },
      });
      throw new BadRequestException(
        'Layanan WhatsApp belum siap. Mohon coba lagi beberapa saat lagi.',
      );
    }

    this.logger.log(`Register: OTP dikirim untuk resident ${residentId}`);
    return {
      registerToken: row.id,
      maskedPhone: this.maskPhone(input.normalized!),
    };
  }

  /**
   * Step 2 — verify the OTP, create the account (identity auto-derived from the
   * resident) and link the resident. Returns auth tokens for auto-login.
   */
  async completeRegistration(
    registerToken: string,
    otp: string,
    newPassword: string,
  ): Promise<AuthTokens & { user: any }> {
    const row = await this.prisma.registerOtp.findUnique({
      where: { id: registerToken },
    });
    const now = new Date();

    if (!row || row.consumed || row.expiresAt < now) {
      throw new BadRequestException(
        'Kode tidak valid atau sudah kadaluarsa. Silakan minta kode baru.',
      );
    }

    const attempts = row.attempts + 1;
    if (attempts > AuthService.MAX_VERIFY_ATTEMPTS) {
      await this.prisma.registerOtp.update({
        where: { id: registerToken },
        data: { consumed: true, attempts },
      });
      throw new BadRequestException(
        'Terlalu banyak percobaan salah. Silakan minta kode baru.',
      );
    }

    // Persist counter dulu agar percobaan salah tetap tercatat walau kemudian throw.
    await this.prisma.registerOtp.update({
      where: { id: registerToken },
      data: { attempts },
    });

    if (this.hashOtp(row.residentId, otp) !== row.otpHash) {
      throw new BadRequestException('Kode OTP salah.');
    }

    // Ambil data resident untuk identitas akun.
    const resident = await this.prisma.resident.findUnique({
      where: { id: row.residentId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        houseUnit: { select: { unitCode: true } },
      },
    });
    if (!resident) {
      throw new BadRequestException('Data warga tidak ditemukan.');
    }

    // Username = kode unit kanonik (mis. "A-101"). Fallback ke nomor unit resident.
    const baseUnit = resident.houseUnit?.unitCode || `resident-${resident.id.slice(0, 8)}`;
    const username = await this.ensureUniqueUsername(baseUnit);

    // Email dari data resident; kalau kosong, pakai placeholder unik.
    const email = await this.ensureUniqueEmail(
      resident.email ||
        `${baseUnit.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}@resident.local`,
    );

    const createUserDto: CreateUserDto = {
      username,
      email,
      password: newPassword,
      passwordMode: 'manual',
      firstName: resident.firstName,
      lastName: resident.lastName,
      phoneNumber: resident.phoneNumber ?? undefined,
      roleId:
        this.configService.get<string>('DEFAULT_USER_ROLE_ID') ||
        'default-user-role',
      isActive: true,
      isEmailVerified: false,
      residentId: resident.id,
    };

    // create() hash password di pusat & auto-link resident via residentId.
    const user = await this.usersService.create(createUserDto);

    // Konsumsi token + void sibling aktif.
    await this.prisma.registerOtp.update({
      where: { id: registerToken },
      data: { consumed: true },
    });
    await this.prisma.registerOtp.updateMany({
      where: { residentId: resident.id, consumed: false },
      data: { consumed: true },
    });

    const userWithRole = await this.usersService.findById(user.id, {
      role: {
        select: { id: true, name: true, description: true },
      },
    });
    const tokens = await this.generateTokens(userWithRole);

    this.logger.log(
      `New user registered via OTP: ${user.username} (unit ${baseUnit})`,
    );

    return {
      ...tokens,
      user: this.buildUserResponse(userWithRole),
    };
  }

  /** Cari username unik berbasis kode unit; tambahkan suffix bila sudah dipakai. */
  private async ensureUniqueUsername(base: string): Promise<string> {
    if (!(await this.usersService.findByUsername(base))) return base;
    for (let i = 0; i < 20; i += 1) {
      const candidate = `${base}_${Date.now().toString().slice(-4)}${i || ''}`;
      if (!(await this.usersService.findByUsername(candidate))) return candidate;
    }
    return `${base}_${Date.now().toString().slice(-4)}`;
  }

  /** Cari email unik; tambahkan suffix numerik bila sudah dipakai. */
  private async ensureUniqueEmail(base: string): Promise<string> {
    const exists = await this.usersService.findByEmail(base);
    if (!exists) return base;
    const [local, domain] = base.split('@');
    let guard = 0;
    let candidate = `${local}${Date.now().toString().slice(-4)}@${domain}`;
    while (guard < 20) {
      const taken = await this.usersService.findByEmail(candidate);
      if (!taken) return candidate;
      candidate = `${local}${Date.now().toString().slice(-4)}${guard}@${domain}`;
      guard += 1;
    }
    return candidate;
  }

  /** Sliding-window throttle per key; throws when the window limit is exceeded. */
  private checkThrottle(key: string): void {
    const now = Date.now();
    const window = AuthService.THROTTLE_WINDOW_MS;
    const recent = (this.requestThrottle.get(key) ?? []).filter(
      (ts) => now - ts < window,
    );
    if (recent.length >= AuthService.THROTTLE_MAX) {
      throw new BadRequestException(
        'Terlalu banyak permintaan reset password. Silakan coba lagi dalam beberapa menit.',
      );
    }
    recent.push(now);
    this.requestThrottle.set(key, recent);
  }

  /** Keyed SHA-256 hash of the OTP so the 6-digit code is never stored plaintext. */
  private hashOtp(userId: string, code: string): string {
    const secret =
      this.configService.get<string>('OTP_HASH_SECRET') ||
      this.configService.get<string>('jwt.secret') ||
      'default-secret-key';
    return crypto
      .createHash('sha256')
      .update(`${code}:${userId}:${secret}`)
      .digest('hex');
  }

  /** "6281234567890" -> "0812****90" style display for the UI hint. */
  private maskPhone(normalized: string): string {
    const local = normalized.startsWith('62')
      ? '0' + normalized.slice(2)
      : normalized;
    if (local.length <= 6) return '••••';
    return `${local.slice(0, 4)}****${local.slice(-2)}`;
  }

  async generateTokens(user: any): Promise<AuthTokens> {
    const payload: TokenPayload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      roleId: user.roleId,
      type: 'access',
    };

    const accessToken = this.jwtService.sign(payload);

    const refreshToken = this.jwtService.sign(
      { ...payload, type: 'refresh' },
      {
        secret: this.configService.get<string>('jwt.refreshSecret') || 'default-refresh-secret',
        expiresIn: (this.configService.get<string>('jwt.refreshExpiresIn') || '7d') as any,
      },
    );

    const expiresIn = this.configService.get<string>('jwt.expiresIn') || '1h';
    const expiresInSeconds = this.parseExpirationToSeconds(expiresIn);

    return {
      accessToken,
      refreshToken,
      expiresIn: expiresInSeconds,
      tokenType: 'Bearer',
    };
  }

  private parseExpirationToSeconds(expiration: string): number {
    const match = expiration.match(/^(\d+)([smhd])$/);
    if (!match) return 3600; // Default 1 hour

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    };

    return value * (multipliers[unit] || 3600);
  }

  /**
   * Build the refresh token DB expiry from the same config value used to sign
   * the JWT (`jwt.refreshExpiresIn`), so the stored expiry always matches the
   * token's real lifetime.
   */
  private getRefreshTokenExpiryDate(): Date {
    const expiration =
      this.configService.get<string>('jwt.refreshExpiresIn') || '7d';
    const expiresInSeconds = this.parseExpirationToSeconds(expiration);
    return new Date(Date.now() + expiresInSeconds * 1000);
  }

  async validateToken(token: string): Promise<JwtPayload> {
    try {
      return this.jwtService.verify<JwtPayload>(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
