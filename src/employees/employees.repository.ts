import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Employee } from '@prisma/client';
import { generateEmployeeCode } from './helpers/employee-code.helper';

@Injectable()
export class EmployeesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: any;
    orderBy?: any;
    include?: any;
  }): Promise<{ employees: Employee[]; total: number }> {
    const { skip, take, where, orderBy, include } = params;

    const [employees, total] = await Promise.all([
      this.prisma.employee.findMany({
        where: { ...where, deletedAt: null },
        skip,
        take,
        orderBy,
        include: include || {
          position: {
            select: {
              id: true,
              positionCode: true,
              positionName: true,
              department: true,
              level: true,
            },
          },
          role: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          salaryHeaders: {
            where: { deletedAt: null },
            select: {
              id: true,
              payrollNumber: true,
              payPeriod: true,
              paymentDate: true,
              netSalary: true,
              status: true,
            },
          },
          cashAdvances: {
            where: { deletedAt: null },
            select: {
              id: true,
              advanceNumber: true,
              amount: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.employee.count({ where: { ...where, deletedAt: null } }),
    ]);

    return { employees, total };
  }

  async findById(id: string, include?: any): Promise<Employee> {
    const employee = await this.prisma.employee.findFirst({
      where: { id, deletedAt: null },
      include: include || {
        position: true,
        role: true,
        user: true,
        salaryHeaders: {
          where: { deletedAt: null },
          orderBy: { payPeriod: 'desc' },
        },
        cashAdvances: {
          where: { deletedAt: null, status: { in: ['APPROVED', 'DISBURSED', 'PARTIAL'] } },
          orderBy: { requestDate: 'desc' },
        },
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    return employee;
  }

  async findByEmployeeCode(employeeCode: string): Promise<Employee | null> {
    return this.prisma.employee.findFirst({
      where: { employeeCode, deletedAt: null },
      include: { position: true, role: true },
    });
  }

  /**
   * Generate the next sequential employee code (EMP###), e.g. EMP001.
   * Delegates to the shared helper which scans all employees (including
   * soft-deleted) to respect the @unique constraint on employee_code.
   */
  async generateEmployeeCode(): Promise<string> {
    return generateEmployeeCode(this.prisma);
  }

  async create(data: any): Promise<Employee> {
    return this.prisma.employee.create({
      data,
      include: { position: true, role: true },
    });
  }

  async update(id: string, data: any): Promise<Employee> {
    try {
      return await this.prisma.employee.update({
        where: { id },
        data,
        include: { position: true, role: true },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Employee not found');
      }
      throw error;
    }
  }

  async softDelete(id: string): Promise<Employee> {
    return this.update(id, {
      deletedAt: new Date(),
      isActive: false,
      employmentStatus: 'TERMINATED',
      terminationDate: new Date(),
    });
  }

  async restore(id: string): Promise<Employee> {
    return this.prisma.employee.update({
      where: { id },
      data: { deletedAt: null, isActive: true },
      include: { position: true, role: true },
    });
  }

  async updatePassword(id: string, newPassword: string): Promise<void> {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!employee?.userId) {
      return;
    }

    await this.prisma.user.update({
      where: { id: employee.userId },
      data: { password: newPassword },
    });
  }

  async count(where?: any): Promise<number> {
    return this.prisma.employee.count({
      where: { ...where, deletedAt: null },
    });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.employee.count({
      where: { id, deletedAt: null },
    });
    return count > 0;
  }

  async getActiveEmployeesCount(): Promise<number> {
    return this.prisma.employee.count({
      where: { employmentStatus: 'ACTIVE', deletedAt: null },
    });
  }

  async getByPosition(positionId: string): Promise<Employee[]> {
    return this.prisma.employee.findMany({
      where: { positionId, deletedAt: null },
      include: { position: true, role: true },
      orderBy: { firstName: 'asc' },
    });
  }

  async getByDepartment(department: string): Promise<Employee[]> {
    return this.prisma.employee.findMany({
      where: { deletedAt: null },
      include: { position: true, role: true },
      orderBy: { firstName: 'asc' },
    });
  }

  async getByEmploymentStatus(status: string): Promise<Employee[]> {
    return this.prisma.employee.findMany({
      where: { employmentStatus: status, deletedAt: null },
      include: { position: true },
      orderBy: { firstName: 'asc' },
    });
  }

  async getEmployeeStatistics(): Promise<{
    totalEmployees: number;
    activeEmployees: number;
    probationEmployees: number;
    resignedEmployees: number;
    terminatedEmployees: number;
    byDepartment: Record<string, number>;
  }> {
    const [totalEmployees, activeEmployees, probationEmployees, resignedEmployees, terminatedEmployees, employees] =
      await Promise.all([
        this.prisma.employee.count({ where: { deletedAt: null } }),
        this.prisma.employee.count({
          where: { employmentStatus: 'ACTIVE', deletedAt: null },
        }),
        this.prisma.employee.count({
          where: { employmentStatus: 'PROBATION', deletedAt: null },
        }),
        this.prisma.employee.count({
          where: { employmentStatus: 'RESIGNED', deletedAt: null },
        }),
        this.prisma.employee.count({
          where: { employmentStatus: 'TERMINATED', deletedAt: null },
        }),
        this.prisma.employee.findMany({
          where: { deletedAt: null },
          include: { position: { select: { department: true } } },
        }),
      ]);

    const byDepartment: Record<string, number> = {};
    employees.forEach((emp) => {
      const dept = emp.position?.department || 'Unassigned';
      byDepartment[dept] = (byDepartment[dept] || 0) + 1;
    });

    return {
      totalEmployees,
      activeEmployees,
      probationEmployees,
      resignedEmployees,
      terminatedEmployees,
      byDepartment,
    };
  }

  async deactivate(id: string): Promise<Employee> {
    return this.update(id, {
      isActive: false,
      employmentStatus: 'RESIGNED',
      terminationDate: new Date(),
    });
  }

  async activate(id: string): Promise<Employee> {
    return this.update(id, {
      isActive: true,
      employmentStatus: 'ACTIVE',
      terminationDate: null,
    });
  }
}
