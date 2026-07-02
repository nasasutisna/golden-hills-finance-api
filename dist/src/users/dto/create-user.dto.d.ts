export declare class CreateUserDto {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    roleId?: string;
    isActive?: boolean;
    isEmailVerified?: boolean;
    lastLoginAt?: Date;
    refreshToken?: string | null;
    refreshTokenExpiry?: Date | null;
}
