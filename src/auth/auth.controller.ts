import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Get,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import {
  ForgotPasswordRequestDto,
  ResetPasswordDto,
} from './dto/forgot-password.dto';
import {
  RegisterRequestDto,
  RegisterCompleteDto,
} from './dto/register-otp.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CurrentUserData } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ResponseDto } from '../common/dto/response.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User login',
    description: 'Authenticate user with username and password',
  })
  @ApiBody({
    type: LoginDto,
    examples: {
      application: {
        summary: 'Login credentials',
        value: {
          username: 'admin',
          password: 'Admin@123',
        } as LoginDto,
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: ResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Login successful',
      data: result,
    };
  }

  @Public()
  @Post('register')
  @ApiOperation({
    summary: 'User registration',
    description: 'Register a new user account',
  })
  @ApiResponse({
    status: 201,
    description: 'Registration successful',
    type: ResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Conflict - User already exists' })
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.authService.register(registerDto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Registration successful',
      data: result,
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Get new access token using refresh token',
  })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    type: ResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid refresh token' })
  async refreshTokens(@Body() refreshTokenDto: RefreshTokenDto) {
    const result = await this.authService.refreshTokens(refreshTokenDto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Token refreshed successfully',
      data: result,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'User logout',
    description: 'Logout current user and invalidate tokens',
  })
  @ApiResponse({
    status: 200,
    description: 'Logout successful',
    type: ResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(@CurrentUser() user: CurrentUserData) {
    await this.authService.logout(user.id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Logout successful',
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get current user',
    description: 'Get information about the currently authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'User information retrieved successfully',
    type: ResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCurrentUser(@CurrentUser() user: CurrentUserData) {
    const data = await this.authService.getMe(user.id);
    return {
      statusCode: HttpStatus.OK,
      message: 'User retrieved successfully',
      data,
    };
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Change own password',
    description:
      'Self-service password change for the authenticated user. Requires the current password for verification.',
  })
  @ApiBody({
    type: ChangePasswordDto,
    examples: {
      application: {
        summary: 'Change password payload',
        value: {
          currentPassword: 'OldSecure@Pass123',
          newPassword: 'NewSecure@Pass123',
        } as ChangePasswordDto,
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
    type: ResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Current password is incorrect',
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Weak or invalid new password' })
  async changePassword(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.authService.changePassword(
      user.id,
      dto.currentPassword,
      dto.newPassword,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Password changed successfully',
    };
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify email',
    description: 'Verify user email address with token',
  })
  @ApiResponse({
    status: 200,
    description: 'Email verified successfully',
    type: ResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid token' })
  async verifyEmail(@Body('token') token: string) {
    await this.authService.verifyEmail(token);
    return {
      statusCode: HttpStatus.OK,
      message: 'Email verified successfully',
    };
  }

  @Public()
  @Post('forgot-password/request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request password reset OTP',
    description:
      'Kirim OTP reset password ke nomor WhatsApp yang terdaftar pada unit. ' +
      'Response selalu 200 untuk mencegah enumerasi akun.',
  })
  @ApiBody({ type: ForgotPasswordRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Permintaan diproses (kode dikirim jika data terdaftar).',
    type: ResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request - throttle atau WhatsApp belum siap' })
  async requestPasswordReset(@Body() dto: ForgotPasswordRequestDto) {
    const result = await this.authService.requestPasswordReset(
      dto.unitNumber,
      dto.phoneNumber,
    );
    return {
      statusCode: HttpStatus.OK,
      message:
        'Jika data terdaftar, kode verifikasi telah dikirim ke WhatsApp Anda.',
      data: result,
    };
  }

  @Public()
  @Post('forgot-password/reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset password with OTP',
    description:
      'Verifikasi OTP dari WhatsApp dan set password baru. Token didapat dari langkah request.',
  })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password berhasil direset.',
    type: ResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request - OTP salah/kadaluarsa atau password lemah' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(
      dto.resetToken,
      dto.otp,
      dto.newPassword,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Password berhasil direset. Silakan login dengan password baru.',
    };
  }

  @Public()
  @Post('register/request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request registration OTP',
    description:
      'Cocokkan unit + nomor WhatsApp terdaftar. Jika unit sudah punya akun, ' +
      'kembalikan 409 "akun sudah terdaftar". Jika cocok & belum berakun, ' +
      'kirim OTP 6-digit via WhatsApp.',
  })
  @ApiBody({ type: RegisterRequestDto })
  @ApiResponse({
    status: 200,
    description: 'OTP dikirim; mengembalikan registerToken + maskedPhone.',
    type: ResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request - unit/nomor tidak cocok, throttle, atau WA belum siap' })
  @ApiResponse({ status: 409, description: 'Conflict - akun untuk unit sudah terdaftar' })
  async requestRegistration(@Body() dto: RegisterRequestDto) {
    const result = await this.authService.requestRegistration(
      dto.unitNumber,
      dto.phoneNumber,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Kode verifikasi telah dikirim ke WhatsApp Anda.',
      data: result,
    };
  }

  @Public()
  @Post('register/complete')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Complete registration with OTP',
    description:
      'Verifikasi OTP, buat akun (identitas dari data warga), link resident, ' +
      'lalu kembalikan token untuk auto-login.',
  })
  @ApiBody({ type: RegisterCompleteDto })
  @ApiResponse({
    status: 201,
    description: 'Akun dibuat & auto-login.',
    type: ResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request - OTP salah/kadaluarsa atau password lemah' })
  async completeRegistration(@Body() dto: RegisterCompleteDto) {
    const result = await this.authService.completeRegistration(
      dto.registerToken,
      dto.otp,
      dto.newPassword,
    );
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Registrasi berhasil.',
      data: result,
    };
  }
}
