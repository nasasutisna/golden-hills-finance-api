import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmployeeCashAdvance } from '@prisma/client';

@Injectable()
export class EmployeeCashAdvancesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: any;
    orderBy?: any;
  }): Promise<{ advances: EmployeeCashAdvance[]; total: number }> {
    const { skip, take, where, orderBy } = params;

    const [advances, total] = await Promise.all([
      this.prisma.employeeCashAdvance.findMany({
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
          repayments: true,
        },
      }),
      this.prisma.employeeCashAdvance.count({ where }),
    ]);

    return { advances, total };
  }

  async findById(id: string): Promise<any> {
    return this.prisma.employeeCashAdvance.findFirst({
      where: { id, deletedAt: null },
      include: {
        employee: {
          include: {
            position: true,
          },
        },
        repayments: true,
      },
    });
  }

  async findByAdvanceNumber(advanceNumber: string): Promise<EmployeeCashAdvance | null> {
    return this.prisma.employeeCashAdvance.findFirst({
      where: { advanceNumber, deletedAt: null },
    });
  }

  async findByEmployee(employeeId: string): Promise<EmployeeCashAdvance[]> {
    return this.prisma.employeeCashAdvance.findMany({
      where: { employeeId, deletedAt: null },
      include: {
        employee: true,
        repayments: true,
      },
      orderBy: { requestDate: 'desc' },
    });
  }

  async findPendingApproval(): Promise<EmployeeCashAdvance[]> {
    return this.prisma.employeeCashAdvance.findMany({
      where: { status: 'PENDING', deletedAt: null },
      include: {
        employee: true,
      },
      orderBy: { requestDate: 'asc' },
    });
  }

  async create(data: any): Promise<EmployeeCashAdvance> {
    return this.prisma.employeeCashAdvance.create({
      data,
      include: {
        employee: true,
      },
    });
  }

  async update(id: string, data: any): Promise<EmployeeCashAdvance> {
    const advance = await this.findById(id);
    if (!advance) {
      throw new NotFoundException(`Employee cash advance with ID ${id} not found`);
    }

    return this.prisma.employeeCashAdvance.update({
      where: { id },
      data,
      include: {
        employee: {
          include: {
            position: true,
          },
        },
        repayments: true,
      },
    });
  }

  async softDelete(id: string): Promise<EmployeeCashAdvance> {
    const advance = await this.findById(id);
    if (!advance) {
      throw new NotFoundException(`Employee cash advance with ID ${id} not found`);
    }

    return this.prisma.employeeCashAdvance.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async count(where?: any): Promise<number> {
    return this.prisma.employeeCashAdvance.count({ where });
  }
}
