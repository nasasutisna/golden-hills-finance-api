import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapLegacyUser(row: any): any {
    if (!row) {
      return null;
    }

    return {
      id: row.id ? String(row.id) : undefined,
      username: row.username,
      email: row.email ?? `${row.username}@local`,
      password: row.password ?? row.password ?? null,
      firstName: row.first_name ?? row.firstName ?? '',
      lastName: row.last_name ?? row.lastName ?? '',
      isActive: row.is_active !== undefined ? Boolean(row.is_active) : Boolean(row.isActive),
      roleId: row.role_id ? String(row.role_id) : row.roleId ? String(row.roleId) : null,
      lastLoginAt: row.last_login_at ?? row.lastLoginAt ?? null,
      refreshToken: row.refresh_token ?? row.refreshToken ?? null,
      refreshTokenExpiry: row.refresh_token_expiry ?? row.refreshTokenExpiry ?? null,
      createdAt: row.created_at ?? row.createdAt ?? null,
      updatedAt: row.updated_at ?? row.updatedAt ?? null,
    };
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: any;
    orderBy?: any;
    include?: any;
  }): Promise<{ users: User[]; total: number }> {
    const { skip, take, where, orderBy, include } = params;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: { ...where, deletedAt: null },
        skip,
        take,
        orderBy,
        include: include || {
          role: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where: { ...where, deletedAt: null } }),
    ]);

    return { users, total };
  }

  async findById(id: string, include?: any): Promise<User> {
    const rows = await this.prisma.$queryRawUnsafe<any[]>(
      'SELECT id, username, email, password, first_name, last_name, is_active, role_id, last_login_at, refresh_token, refresh_token_expiry, created_at, updated_at FROM users WHERE id = ? LIMIT 1',
      Number(id),
    );

    const user = this.mapLegacyUser(rows[0]);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user as User;
  }

  async findByUsername(username: string): Promise<User | null> {
    const rows = await this.prisma.$queryRawUnsafe<any[]>(
      'SELECT id, username, email, password, first_name, last_name, is_active, role_id, last_login_at, refresh_token, refresh_token_expiry, created_at, updated_at FROM users WHERE username = ? LIMIT 1',
      username,
    );

    return this.mapLegacyUser(rows[0]) as User | null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const rows = await this.prisma.$queryRawUnsafe<any[]>(
      'SELECT id, username, email, password, first_name, last_name, is_active, role_id, last_login_at, refresh_token, refresh_token_expiry, created_at, updated_at FROM users WHERE email = ? LIMIT 1',
      email,
    );

    return this.mapLegacyUser(rows[0]) as User | null;
  }

  async create(data: any): Promise<User> {
    try {
      return await this.prisma.user.create({
        data,
        include: {
          role: {
            select: {
              id: true,
              name: true,
              description: true,
              permissions: true,
            },
          },
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Username or email already exists');
      }
      throw error;
    }
  }

  async update(id: string, data: any): Promise<User> {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.lastLoginAt !== undefined) {
      updates.push('last_login_at = ?');
      values.push(data.lastLoginAt);
    }

    if (data.isActive !== undefined) {
      updates.push('is_active = ?');
      values.push(data.isActive ? 1 : 0);
    }

    if (data.password !== undefined) {
      updates.push('password = ?');
      values.push(data.password);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    values.push(Number(id));
    await this.prisma.$executeRawUnsafe(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      ...values,
    );

    return this.findById(id);
  }

  async softDelete(id: string): Promise<User> {
    return this.update(id, {
      deletedAt: new Date(),
      isActive: false,
    });
  }

  async restore(id: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: null, isActive: true },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            description: true,
            permissions: true,
          },
        },
      },
    });
  }

  async updatePassword(id: string, newPassword: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { password: newPassword },
    });
  }

  async count(where?: any): Promise<number> {
    return this.prisma.user.count({
      where: { ...where, deletedAt: null },
    });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { id, deletedAt: null },
    });
    return count > 0;
  }
}
