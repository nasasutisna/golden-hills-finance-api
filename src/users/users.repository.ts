import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';

const DEFAULT_USER_INCLUDE = {
  role: {
    select: {
      id: true,
      name: true,
      description: true,
    },
  },
  resident: {
    select: {
      id: true,
      residentCode: true,
      firstName: true,
      lastName: true,
      phoneNumber: true,
      houseBlock: {
        select: {
          id: true,
          blockCode: true,
          blockName: true,
        },
      },
    },
  },
};

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

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
        include: include || DEFAULT_USER_INCLUDE,
      }),
      this.prisma.user.count({ where: { ...where, deletedAt: null } }),
    ]);

    return { users, total };
  }

  async findById(id: string, include?: any): Promise<any> {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: include || DEFAULT_USER_INCLUDE,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByUsername(username: string, include?: any): Promise<any | null> {
    return this.prisma.user.findFirst({
      where: { username, deletedAt: null },
      include: include || undefined,
    });
  }

  async findByEmail(email: string, include?: any): Promise<any | null> {
    return this.prisma.user.findFirst({
      where: { email, deletedAt: null },
      include: include || undefined,
    });
  }

  async create(data: any): Promise<any> {
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

  async update(id: string, data: any): Promise<any> {
    try {
      return await this.prisma.user.update({
        where: { id },
        data,
        include: {
          role: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('User not found');
      }
      if (error.code === 'P2002') {
        throw new ConflictException('Username or email already exists');
      }
      throw error;
    }
  }

  async delete(id: string): Promise<any> {
    try {
      return await this.prisma.user.delete({
        where: { id },
        include: {
          role: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('User not found');
      }
      if (error.code === 'P2003') {
        throw new ConflictException(
          'Cannot permanently delete user: this user still has related records ' +
            '(e.g. transactions, payments, approvals). Deactivate the user instead.',
        );
      }
      throw error;
    }
  }

  async restore(id: string): Promise<any> {
    try {
      return await this.prisma.user.update({
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
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('User not found');
      }
      throw error;
    }
  }

  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id },
        data: { password: hashedPassword },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('User not found');
      }
      throw error;
    }
  }

  /**
   * Link a resident to a user account by writing `resident.userId`.
   * The 1:1 relation is enforced by `@unique` on `Resident.userId`.
   */
  async linkResident(residentId: string, userId: string): Promise<void> {
    try {
      await this.prisma.resident.update({
        where: { id: residentId },
        data: { userId },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Resident not found');
      }
      if (error.code === 'P2002') {
        throw new ConflictException('Resident is already linked to another user');
      }
      throw error;
    }
  }

  async unlinkResident(residentId: string): Promise<void> {
    try {
      await this.prisma.resident.update({
        where: { id: residentId },
        data: { userId: null },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Resident not found');
      }
      throw error;
    }
  }

  /**
   * Clear whatever resident is currently linked to this user (set Resident.userId = null).
   * Used when reassigning a user's linked resident.
   */
  async unlinkResidentByUserId(userId: string): Promise<void> {
    await this.prisma.resident.updateMany({
      where: { userId },
      data: { userId: null },
    });
  }

  async findResidentById(residentId: string): Promise<any | null> {
    return this.prisma.resident.findFirst({
      where: { id: residentId, deletedAt: null },
      include: {
        houseBlock: {
          select: { id: true, blockCode: true, blockName: true },
        },
      },
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
