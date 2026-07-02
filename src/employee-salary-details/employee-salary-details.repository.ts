import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmployeeSalaryDetail } from '@prisma/client';

@Injectable()
export class EmployeeSalaryDetailsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: any;
    orderBy?: any;
  }): Promise<{ details: EmployeeSalaryDetail[]; total: number }> {
    const { skip, take, where, orderBy } = params;

    const [details, total] = await Promise.all([
      this.prisma.employeeSalaryDetail.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          salaryHeader: {
            include: {
              employee: {
                select: {
                  id: true,
                  employeeCode: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          component: true,
        },
      }),
      this.prisma.employeeSalaryDetail.count({ where }),
    ]);

    return { details, total };
  }

  async findById(id: string): Promise<EmployeeSalaryDetail | null> {
    return this.prisma.employeeSalaryDetail.findFirst({
      where: { id, deletedAt: null },
      include: {
        salaryHeader: {
          include: {
            employee: true,
          },
        },
        component: true,
      },
    });
  }

  async findBySalaryHeader(salaryHeaderId: string): Promise<EmployeeSalaryDetail[]> {
    return this.prisma.employeeSalaryDetail.findMany({
      where: { salaryHeaderId, deletedAt: null },
      include: {
        component: true,
      },
      orderBy: {
        component: {
          calculationOrder: 'asc',
        },
      },
    });
  }

  async create(data: any): Promise<EmployeeSalaryDetail> {
    return this.prisma.employeeSalaryDetail.create({
      data,
      include: {
        salaryHeader: true,
        component: true,
      },
    });
  }

  async update(id: string, data: any): Promise<EmployeeSalaryDetail> {
    const detail = await this.findById(id);
    if (!detail) {
      throw new NotFoundException(`Employee salary detail with ID ${id} not found`);
    }

    return this.prisma.employeeSalaryDetail.update({
      where: { id },
      data,
      include: {
        salaryHeader: {
          include: {
            employee: true,
          },
        },
        component: true,
      },
    });
  }

  async softDelete(id: string): Promise<EmployeeSalaryDetail> {
    const detail = await this.findById(id);
    if (!detail) {
      throw new NotFoundException(`Employee salary detail with ID ${id} not found`);
    }

    return this.prisma.employeeSalaryDetail.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async count(where?: any): Promise<number> {
    return this.prisma.employeeSalaryDetail.count({ where });
  }
}
