"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_service_1 = require("./auth.service");
const login_dto_1 = require("./dto/login.dto");
const register_dto_1 = require("./dto/register.dto");
const refresh_token_dto_1 = require("./dto/refresh-token.dto");
const change_password_dto_1 = require("./dto/change-password.dto");
const forgot_password_dto_1 = require("./dto/forgot-password.dto");
const register_otp_dto_1 = require("./dto/register-otp.dto");
const public_decorator_1 = require("../common/decorators/public.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const response_dto_1 = require("../common/dto/response.dto");
let AuthController = class AuthController {
    constructor(authService) {
        this.authService = authService;
    }
    async login(loginDto) {
        const result = await this.authService.login(loginDto);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Login successful',
            data: result,
        };
    }
    async register(registerDto) {
        const result = await this.authService.register(registerDto);
        return {
            statusCode: common_1.HttpStatus.CREATED,
            message: 'Registration successful',
            data: result,
        };
    }
    async refreshTokens(refreshTokenDto) {
        const result = await this.authService.refreshTokens(refreshTokenDto);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Token refreshed successfully',
            data: result,
        };
    }
    async logout(user) {
        await this.authService.logout(user.id);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Logout successful',
        };
    }
    async getCurrentUser(user) {
        const data = await this.authService.getMe(user.id);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'User retrieved successfully',
            data,
        };
    }
    async changePassword(user, dto) {
        await this.authService.changePassword(user.id, dto.currentPassword, dto.newPassword);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Password changed successfully',
        };
    }
    async verifyEmail(token) {
        await this.authService.verifyEmail(token);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Email verified successfully',
        };
    }
    async requestPasswordReset(dto) {
        const result = await this.authService.requestPasswordReset(dto.unitNumber, dto.phoneNumber);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Jika data terdaftar, kode verifikasi telah dikirim ke WhatsApp Anda.',
            data: result,
        };
    }
    async resetPassword(dto) {
        await this.authService.resetPassword(dto.resetToken, dto.otp, dto.newPassword);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Password berhasil direset. Silakan login dengan password baru.',
        };
    }
    async requestRegistration(dto) {
        const result = await this.authService.requestRegistration(dto.unitNumber, dto.phoneNumber);
        return {
            statusCode: common_1.HttpStatus.OK,
            message: 'Kode verifikasi telah dikirim ke WhatsApp Anda.',
            data: result,
        };
    }
    async completeRegistration(dto) {
        const result = await this.authService.completeRegistration(dto.registerToken, dto.otp, dto.newPassword);
        return {
            statusCode: common_1.HttpStatus.CREATED,
            message: 'Registrasi berhasil.',
            data: result,
        };
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'User login',
        description: 'Authenticate user with username and password',
    }),
    (0, swagger_1.ApiBody)({
        type: login_dto_1.LoginDto,
        examples: {
            application: {
                summary: 'Login credentials',
                value: {
                    username: 'admin',
                    password: 'Admin@123',
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Login successful',
        type: response_dto_1.ResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized - Invalid credentials' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('register'),
    (0, swagger_1.ApiOperation)({
        summary: 'User registration',
        description: 'Register a new user account',
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Registration successful',
        type: response_dto_1.ResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Conflict - User already exists' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_dto_1.RegisterDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('refresh'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Refresh access token',
        description: 'Get new access token using refresh token',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Token refreshed successfully',
        type: response_dto_1.ResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized - Invalid refresh token' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [refresh_token_dto_1.RefreshTokenDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refreshTokens", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({
        summary: 'User logout',
        description: 'Logout current user and invalidate tokens',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Logout successful',
        type: response_dto_1.ResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get current user',
        description: 'Get information about the currently authenticated user',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'User information retrieved successfully',
        type: response_dto_1.ResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getCurrentUser", null);
__decorate([
    (0, common_1.Post)('change-password'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)('JWT-auth'),
    (0, swagger_1.ApiOperation)({
        summary: 'Change own password',
        description: 'Self-service password change for the authenticated user. Requires the current password for verification.',
    }),
    (0, swagger_1.ApiBody)({
        type: change_password_dto_1.ChangePasswordDto,
        examples: {
            application: {
                summary: 'Change password payload',
                value: {
                    currentPassword: 'OldSecure@Pass123',
                    newPassword: 'NewSecure@Pass123',
                },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Password changed successfully',
        type: response_dto_1.ResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: 401,
        description: 'Unauthorized - Current password is incorrect',
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad Request - Weak or invalid new password' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, change_password_dto_1.ChangePasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "changePassword", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('verify-email'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Verify email',
        description: 'Verify user email address with token',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Email verified successfully',
        type: response_dto_1.ResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad Request - Invalid token' }),
    __param(0, (0, common_1.Body)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyEmail", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('forgot-password/request'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Request password reset OTP',
        description: 'Kirim OTP reset password ke nomor WhatsApp yang terdaftar pada unit. ' +
            'Response selalu 200 untuk mencegah enumerasi akun.',
    }),
    (0, swagger_1.ApiBody)({ type: forgot_password_dto_1.ForgotPasswordRequestDto }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Permintaan diproses (kode dikirim jika data terdaftar).',
        type: response_dto_1.ResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad Request - throttle atau WhatsApp belum siap' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [forgot_password_dto_1.ForgotPasswordRequestDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "requestPasswordReset", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('forgot-password/reset'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Reset password with OTP',
        description: 'Verifikasi OTP dari WhatsApp dan set password baru. Token didapat dari langkah request.',
    }),
    (0, swagger_1.ApiBody)({ type: forgot_password_dto_1.ResetPasswordDto }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Password berhasil direset.',
        type: response_dto_1.ResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad Request - OTP salah/kadaluarsa atau password lemah' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [forgot_password_dto_1.ResetPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resetPassword", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('register/request'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Request registration OTP',
        description: 'Cocokkan unit + nomor WhatsApp terdaftar. Jika unit sudah punya akun, ' +
            'kembalikan 409 "akun sudah terdaftar". Jika cocok & belum berakun, ' +
            'kirim OTP 6-digit via WhatsApp.',
    }),
    (0, swagger_1.ApiBody)({ type: register_otp_dto_1.RegisterRequestDto }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'OTP dikirim; mengembalikan registerToken + maskedPhone.',
        type: response_dto_1.ResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad Request - unit/nomor tidak cocok, throttle, atau WA belum siap' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Conflict - akun untuk unit sudah terdaftar' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_otp_dto_1.RegisterRequestDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "requestRegistration", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('register/complete'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({
        summary: 'Complete registration with OTP',
        description: 'Verifikasi OTP, buat akun (identitas dari data warga), link resident, ' +
            'lalu kembalikan token untuk auto-login.',
    }),
    (0, swagger_1.ApiBody)({ type: register_otp_dto_1.RegisterCompleteDto }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'Akun dibuat & auto-login.',
        type: response_dto_1.ResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Bad Request - OTP salah/kadaluarsa atau password lemah' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_otp_dto_1.RegisterCompleteDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "completeRegistration", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('Authentication'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map