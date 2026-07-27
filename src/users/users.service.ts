import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { QueryOptionsDto } from '../common/dto/query-options.dto';
import { CreateUserDto, PasswordMode } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UsersRepository } from './users.repository';
import { WhatsappBlastService } from '../whatsapp-blast/whatsapp-blast.service';
import { SendTestDto } from '../whatsapp-blast/dto/send-test.dto';

interface PasswordDeliveryResult {
  sent: boolean;
  error?: string;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly configService: ConfigService,
    private readonly whatsappBlastService: WhatsappBlastService,
  ) {}

  async findAll(queryOptions: QueryOptionsDto) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', search, searchFields, filters } = queryOptions;

    const skip = (page - 1) * limit;

    let where: any = {};

    // Add search filter
    if (search && searchFields) {
      const fields = searchFields.split(',');
      where.OR = fields.map((field) => ({
        [field]: { contains: search },
      }));
    }

    // Add additional filters
    if (filters) {
      where = { ...where, ...filters };
    }

    const { users, total } = await this.usersRepository.findAll({
      skip,
      take: limit,
      where,
      orderBy: { [sortBy]: sortOrder },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: users.map((user) => this.excludeSensitiveData(user)),
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    };
  }

  async findById(id: string, include?: any) {
    const user = await this.usersRepository.findById(id, include);
    return this.excludeSensitiveData(user);
  }

  async findByUsername(username: string, include?: any) {
    const user = await this.usersRepository.findByUsername(username, include);
    return user ?? null;
  }

  async findByEmail(email: string) {
    return this.usersRepository.findByEmail(email);
  }

  async create(createUserDto: CreateUserDto) {
    const mode: PasswordMode = createUserDto.passwordMode ?? 'manual';
    const plainPassword = this.resolvePlainPassword(createUserDto, mode);
    const hashedPassword = await this.hashPassword(plainPassword);

    // Strip non-model fields before persisting the user row.
    const {
      residentId,
      passwordMode,
      sendViaWhatsapp,
      password: _plain,
      ...userData
    } = createUserDto;

    let user: any;
    try {
      user = await this.usersRepository.create({
        ...userData,
        password: hashedPassword,
      });
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error('Error creating user:', error);
      throw error;
    }

    // Link resident (1:1 via Resident.userId)
    let resident: any = user.resident ?? null;
    if (residentId) {
      try {
        await this.usersRepository.unlinkResidentByUserId(user.id);
        await this.usersRepository.linkResident(residentId, user.id);
        resident = await this.usersRepository.findResidentById(residentId);
      } catch (error) {
        this.logger.error(
          `User ${user.username} created but resident link failed: ${error?.message}`,
        );
        throw error;
      }
    }

    // Optional: send credentials via WhatsApp
    let whatsappResult: PasswordDeliveryResult = { sent: false };
    if (sendViaWhatsapp) {
      const phone = resident?.phoneNumber ?? user.phoneNumber ?? null;
      whatsappResult = await this.sendCredentialsViaWhatsapp({
        phoneNumber: phone,
        firstName: user.firstName,
        username: user.username,
        password: plainPassword,
      });
    }

    this.logger.log(`User created: ${user.username}`);

    const safeUser = this.excludeSensitiveData({ ...user, resident });
    return {
      ...safeUser,
      generatedPassword: mode === 'generate' ? plainPassword : undefined,
      whatsappSent: whatsappResult.sent,
      whatsappError: whatsappResult.error,
    };
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const {
      residentId,
      passwordMode: _pm,
      sendViaWhatsapp: _wa,
      ...userData
    } = updateUserDto as any;

    let user: any;
    try {
      user = await this.usersRepository.update(id, userData);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Error updating user:', error);
      throw error;
    }

    // Reassign / clear linked resident
    if (residentId !== undefined) {
      await this.usersRepository.unlinkResidentByUserId(id);
      if (residentId) {
        await this.usersRepository.linkResident(residentId, id);
      }
    }

    this.logger.log(`User updated: ${user.username}`);
    return this.excludeSensitiveData(await this.usersRepository.findById(id));
  }

  async delete(id: string) {
    const user = await this.usersRepository.delete(id);
    this.logger.log(`User deleted (hard): ${user.username}`);
    return this.excludeSensitiveData(user);
  }

  async restore(id: string) {
    const user = await this.usersRepository.restore(id);
    this.logger.log(`User restored: ${user.username}`);
    return this.excludeSensitiveData(user);
  }

  async deactivate(id: string) {
    const user = await this.usersRepository.update(id, { isActive: false });
    this.logger.log(`User deactivated: ${user.username}`);
    return this.excludeSensitiveData(user);
  }

  async activate(id: string) {
    const user = await this.usersRepository.update(id, { isActive: true });
    this.logger.log(`User activated: ${user.username}`);
    return this.excludeSensitiveData(user);
  }

  /**
   * Set/reset a user's password. Hashes the new password (manual or generated)
   * and optionally delivers it via WhatsApp.
   */
  async resetPassword(id: string, dto: ResetPasswordDto) {
    const mode: PasswordMode = dto.passwordMode ?? 'manual';
    const plainPassword = this.resolvePlainPassword(dto, mode);
    const hashedPassword = await this.hashPassword(plainPassword);

    await this.usersRepository.updatePassword(id, hashedPassword);

    let whatsappResult: PasswordDeliveryResult = { sent: false };
    if (dto.sendViaWhatsapp) {
      const user = await this.usersRepository.findById(id);
      const phone = user?.resident?.phoneNumber ?? user?.phoneNumber ?? null;
      whatsappResult = await this.sendCredentialsViaWhatsapp({
        phoneNumber: phone,
        firstName: user?.firstName ?? 'Pengguna',
        username: user?.username ?? '',
        password: plainPassword,
      });
    }

    this.logger.log(`Password reset for user: ${id}`);
    return {
      generatedPassword: mode === 'generate' ? plainPassword : undefined,
      whatsappSent: whatsappResult.sent,
      whatsappError: whatsappResult.error,
    };
  }

  async updatePassword(id: string, newPassword: string) {
    const hashed = await this.hashPassword(newPassword);
    await this.usersRepository.updatePassword(id, hashed);
    this.logger.log(`Password updated for user: ${id}`);
  }

  /**
   * Verify a plain password against the stored hash. Used by the self-service
   * change-password flow to prove ownership of the account before setting a
   * new password. Reads the raw user row (repository returns the password
   * hash; the service-level `findById` strips it).
   */
  async verifyPassword(userId: string, plainPassword: string): Promise<boolean> {
    const user = await this.usersRepository.findById(userId);
    if (!user?.password) {
      return false;
    }
    try {
      return await bcrypt.compare(plainPassword, user.password);
    } catch (error) {
      this.logger.warn(`Invalid password hash for user ${userId}`);
      return false;
    }
  }

  private async hashPassword(plain: string): Promise<string> {
    const rounds = parseInt(
      this.configService.get<string>('BCRYPT_ROUNDS', '10'),
      10,
    );
    return bcrypt.hash(plain, rounds);
  }

  /**
   * Resolve the plain password according to the mode. Generated passwords are
   * constrained to the IsStrongPassword charset so they pass validation on login
   * change flows and meet the strength policy.
   */
  private resolvePlainPassword(
    dto: { password?: string; passwordMode?: PasswordMode },
    mode: PasswordMode,
  ): string {
    if (mode === 'generate') {
      return this.generateStrongPassword();
    }
    if (!dto.password) {
      throw new BadRequestException(
        'Password is required when passwordMode is "manual"',
      );
    }
    return dto.password;
  }

  private generateStrongPassword(length = 12): string {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lower = 'abcdefghijkmnopqrstuvwxyz';
    const digits = '23456789';
    const special = '@$!%*?&';
    const all = upper + lower + digits + special;
    const pick = (set: string) => set[Math.floor(Math.random() * set.length)];

    // Guarantee at least one of each required class.
    const required = [pick(upper), pick(lower), pick(digits), pick(special)];
    const remaining = Array.from({ length: Math.max(0, length - required.length) }, () => pick(all));
    const chars = [...required, ...remaining];

    // Fisher–Yates shuffle
    for (let i = chars.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    return chars.join('');
  }

  private async sendCredentialsViaWhatsapp(params: {
    phoneNumber?: string | null;
    firstName: string;
    username: string;
    password: string;
  }): Promise<PasswordDeliveryResult> {
    if (!params.phoneNumber) {
      return {
        sent: false,
        error: 'Nomor WhatsApp warga tidak tersedia (resident.phoneNumber kosong).',
      };
    }
    const message =
      `Halo ${params.firstName}, kredensial akun Golden Hills Anda:\n\n` +
      `Username: ${params.username}\n` +
      `Password sementara: ${params.password}\n\n` +
      `Mohon login dan segera ganti password Anda. Terima kasih.`;
    try {
      await this.whatsappBlastService.sendTest({
        phoneNumber: params.phoneNumber,
        message,
      } as SendTestDto);
      return { sent: true };
    } catch (err: any) {
      return { sent: false, error: err?.message ?? String(err) };
    }
  }

  private excludeSensitiveData(user: any) {
    if (!user) return user;
    const { password, refreshToken, refreshTokenExpiry, ...safeUser } = user;
    return safeUser;
  }

  async count(where?: any): Promise<number> {
    return this.usersRepository.count(where);
  }

  async exists(id: string): Promise<boolean> {
    return this.usersRepository.exists(id);
  }
}
