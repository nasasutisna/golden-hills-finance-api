import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmployeePosition } from '@prisma/client';

@Injectable()
export class EmployeePositionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: any;
    orderBy?: any;
  }): Promise<{ positions: EmployeePosition[]; total: number }> {
    const { skip, take, where, orderBy } = params;

    const [positions, total] = await Promise.all([
      this.prisma.employeePosition.findMany({
        where: { ...where, deletedAt: null },
        skip,
        take,
        orderBy,
        include: {
          employees: {
            where: { deletedAt: null },
            select: {
              id: true,
              employeeCode: true,
              firstName: true,
              lastName: true,
              employmentStatus: true,
            },
          },
        },
      }),
      this.prisma.employeePosition.count({ where: { ...where, deletedAt: null } }),
    ]);

    return { positions, total };
  }

  async findById(id: string): Promise<EmployeePosition> {
    const position = await this.prisma.employeePosition.findFirst({
      where: { id, deletedAt: null },
      include: { employees: true },
    });

    if (!position) {
      throw new NotFoundException('Employee position not found');
    }

    return position;
  }

  async findByPositionCode(positionCode: string): Promise<EmployeePosition | null> {
    return this.prisma.employeePosition.findFirst({
      where: { positionCode, deletedAt: null },
      include: { employees: true },
    });
  }

  async create(data: any): Promise<EmployeePosition> {
    return this.prisma.employeePosition.create({
      data,
      include: { employees: true },
    });
  }

  async update(id: string, data: any): Promise<EmployeePosition> {
    try {
      return await this.prisma.employeePosition.update({
        where: { id },
        data,
        include: { employees: true },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Employee position not found');
      }
      throw error;
    }
  }

  async softDelete(id: string): Promise<EmployeePosition> {
    return this.update(id, {
      deletedAt: new Date(),
      isActive: false,
    });
  }

  async restore(id: string): Promise<EmployeePosition> {
    return this.prisma.employeePosition.update({
      where: { id },
      data: { deletedAt: null, isActive: true },
      include: { employees: true },
    });
  }

  async count(where?: any): Promise<number> {
    return this.prisma.employeePosition.count({
      where: { ...where, deletedAt: null },
    });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.employeePosition.count({
      where: { id, deletedAt: null },
    });
    return count > 0;
  }

  async getActivePositions(): Promise<EmployeePosition[]> {
    return this.prisma.employeePosition.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { level: 'desc' },
    });
  }

  async getByDepartment(department: string): Promise<EmployeePosition[]> {
    return this.prisma.employeePosition.findMany({
      where: { department, deletedAt: null },
      orderBy: { level: 'desc' },
    });
  }
}
