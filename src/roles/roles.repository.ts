import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class RolesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: any;
    orderBy?: any;
  }): Promise<{ roles: Role[]; total: number }> {
    const { skip, take, where, orderBy } = params;

    const [roles, total] = await Promise.all([
      this.prisma.role.findMany({
        where: { ...where, deletedAt: null },
        skip,
        take,
        orderBy,
      }),
      this.prisma.role.count({ where: { ...where, deletedAt: null } }),
    ]);

    return { roles, total };
  }

  async findById(id: string): Promise<Role | null> {
    return this.prisma.role.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findByName(name: string): Promise<Role | null> {
    return this.prisma.role.findFirst({
      where: { name, deletedAt: null },
    });
  }

  async create(data: any): Promise<Role> {
    return this.prisma.role.create({
      data,
    });
  }

  async update(id: string, data: any): Promise<Role> {
    return this.prisma.role.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string): Promise<Role> {
    return this.prisma.role.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  async restore(id: string): Promise<Role> {
    return this.prisma.role.update({
      where: { id },
      data: { deletedAt: null, isActive: true },
    });
  }

  async count(where?: any): Promise<number> {
    return this.prisma.role.count({
      where: { ...where, deletedAt: null },
    });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.role.count({
      where: { id, deletedAt: null },
    });
    return count > 0;
  }
}
