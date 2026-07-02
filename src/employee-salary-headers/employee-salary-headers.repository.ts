import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmployeeSalaryHeader } from '@prisma/client';

@Injectable()
export class EmployeeSalaryHeadersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: any;
    orderBy?: any;
  }): Promise<{ headers: EmployeeSalaryHeader[]; total: number }> {
    const { skip, take, where, orderBy } = params;

    const [headers, total] = await Promise.all([
      this.prisma.employeeSalaryHeader.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          employee: {
            select: {
              id: true,
              employeeCode: true,
              firstName: true,
              lastName: true,
              position: {
                select: {
                  id: true,
                  positionName: true,
                },
              },
            },
          },
          details: {
            include: {
              component: true,
            },
          },
        },
      }),
      this.prisma.employeeSalaryHeader.count({ where }),
    ]);

    return { headers, total };
  }

  async findById(id: string): Promise<any> {
    return this.prisma.employeeSalaryHeader.findFirst({
      where: { id, deletedAt: null },
      include: {
        employee: {
          include: {
            position: true,
          },
        },
        details: {
          include: {
            component: true,
          },
        },
      },
    });
  }

  async findByPayrollNumber(payrollNumber: string): Promise<EmployeeSalaryHeader | null> {
    return this.prisma.employeeSalaryHeader.findFirst({
      where: { payrollNumber, deletedAt: null },
    });
  }

  async findByEmployeeAndPeriod(employeeId: string, payPeriod: string): Promise<EmployeeSalaryHeader | null> {
    return this.prisma.employeeSalaryHeader.findFirst({
      where: { employeeId, payPeriod, deletedAt: null },
    });
  }

  async create(data: any): Promise<EmployeeSalaryHeader> {
    return this.prisma.employeeSalaryHeader.create({
      data,
      include: {
        employee: true,
      },
    });
  }

  async update(id: string, data: any): Promise<EmployeeSalaryHeader> {
    const header = await this.findById(id);
    if (!header) {
      throw new NotFoundException(`Employee salary header with ID ${id} not found`);
    }

    return this.prisma.employeeSalaryHeader.update({
      where: { id },
      data,
      include: {
        employee: {
          include: {
            position: true,
          },
        },
        details: {
          include: {
            component: true,
          },
        },
      },
    });
  }

  async softDelete(id: string): Promise<EmployeeSalaryHeader> {
    const header = await this.findById(id);
    if (!header) {
      throw new NotFoundException(`Employee salary header with ID ${id} not found`);
    }

    return this.prisma.employeeSalaryHeader.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async count(where?: any): Promise<number> {
    return this.prisma.employeeSalaryHeader.count({ where });
  }
}
