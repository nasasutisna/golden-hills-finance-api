import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, SecuritySchedule } from '@prisma/client';

@Injectable()
export class SecuritySchedulesRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Reusable include for enriching a schedule with its assigned employee.
  // NOTE: Prisma 7 no longer allows a `where` filter inside a relation include —
  // only `select`/`include` args are accepted there. Employees are validated
  // active on assignment, so no relation soft-delete filter is needed here.
  private readonly employeeInclude = {
    employee: {
      select: {
        id: true,
        employeeCode: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        photo: true,
        isActive: true,
        position: {
          select: { id: true, positionName: true, department: true },
        },
      },
    },
  };

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: any;
    orderBy?: any;
  }): Promise<{ schedules: SecuritySchedule[]; total: number }> {
    const { skip, take, where, orderBy } = params;

    // Prisma 7 requires orderBy as an ARRAY of order inputs (single object is rejected).
    const finalOrderBy = orderBy ?? [{ specificDate: 'asc' }, { shift: 'asc' }];

    const [schedules, total] = await Promise.all([
      this.prisma.securitySchedule.findMany({
        where: { ...where, deletedAt: null },
        skip,
        take,
        orderBy: finalOrderBy,
        include: this.employeeInclude,
      }),
      this.prisma.securitySchedule.count({ where: { ...where, deletedAt: null } }),
    ]);

    return { schedules, total };
  }

  async findById(id: string): Promise<SecuritySchedule> {
    const schedule = await this.prisma.securitySchedule.findFirst({
      where: { id, deletedAt: null },
      include: this.employeeInclude,
    });

    if (!schedule) {
      throw new NotFoundException('Security schedule not found');
    }

    return schedule;
  }

  async create(data: any): Promise<SecuritySchedule> {
    return this.prisma.securitySchedule.create({
      data,
      include: this.employeeInclude,
    });
  }

  async createMany(data: Prisma.SecurityScheduleCreateManyInput[]): Promise<number> {
    const result = await this.prisma.securitySchedule.createMany({ data });
    return result.count;
  }

  async update(id: string, data: any): Promise<SecuritySchedule> {
    try {
      return await this.prisma.securitySchedule.update({
        where: { id },
        data,
        include: this.employeeInclude,
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Security schedule not found');
      }
      throw error;
    }
  }

  async softDelete(id: string): Promise<SecuritySchedule> {
    return this.update(id, {
      deletedAt: new Date(),
      isActive: false,
    });
  }

  /**
   * Hard-delete all entries (incl. soft-deleted) in a [from, to] date range.
   * Used by the generator to wipe a month before regenerating.
   */
  async deleteRange(from: Date, to: Date): Promise<number> {
    const result = await this.prisma.securitySchedule.deleteMany({
      where: {
        specificDate: { gte: from, lte: to },
      },
    });
    return result.count;
  }

  /**
   * Hard-delete every entry for a single date (incl. soft-deleted).
   * Used by setDay to replace a day's schedule atomically.
   */
  async deleteOneDay(date: Date): Promise<number> {
    const result = await this.prisma.securitySchedule.deleteMany({
      where: { specificDate: date },
    });
    return result.count;
  }

  async count(where?: any): Promise<number> {
    return this.prisma.securitySchedule.count({
      where: { ...where, deletedAt: null },
    });
  }
}
