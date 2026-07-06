import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { EmployeeSalaryHeadersRepository } from './employee-salary-headers.repository';
import { CreateEmployeeSalaryHeaderDto } from './dto/create-employee-salary-header.dto';
import { UpdateEmployeeSalaryHeaderDto } from './dto/update-employee-salary-header.dto';
import { QueryEmployeeSalaryHeadersDto } from './dto/query-employee-salary-headers.dto';
import { PrismaService } from '../prisma/prisma.service';
import { PayrollStatus } from './dto/create-employee-salary-header.dto';

@Injectable()
export class EmployeeSalaryHeadersService {
  constructor(
    private readonly repository: EmployeeSalaryHeadersRepository,
    private readonly prisma: PrismaService,
  ) {}

  async create(createEmployeeSalaryHeaderDto: CreateEmployeeSalaryHeaderDto) {
    // Check if payroll number already exists
    const existing = await this.repository.findByPayrollNumber(createEmployeeSalaryHeaderDto.payrollNumber);
    if (existing) {
      throw new ConflictException(`Payroll with number ${createEmployeeSalaryHeaderDto.payrollNumber} already exists`);
    }

    // Check if salary for this employee and period already exists
    const existingPeriod = await this.repository.findByEmployeeAndPeriod(
      createEmployeeSalaryHeaderDto.employeeId,
      createEmployeeSalaryHeaderDto.payPeriod
    );
    if (existingPeriod) {
      throw new ConflictException(`Salary for employee ${createEmployeeSalaryHeaderDto.employeeId} in period ${createEmployeeSalaryHeaderDto.payPeriod} already exists`);
    }

    // Check if employee exists
    const employee = await this.prisma.employee.findFirst({
      where: { id: createEmployeeSalaryHeaderDto.employeeId, deletedAt: null },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${createEmployeeSalaryHeaderDto.employeeId} not found`);
    }

    return this.repository.create(createEmployeeSalaryHeaderDto);
  }

  async findAll(queryDto: QueryEmployeeSalaryHeadersDto) {
    const { page = 1, limit = 10, sortBy, sortOrder, status, employeeId, payPeriod, paymentDateFrom, paymentDateTo, search, locked } = queryDto;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };

    if (status) {
      where.status = status;
    }

    if (employeeId) {
      where.employeeId = employeeId;
    }

    if (payPeriod) {
      where.payPeriod = payPeriod;
    }

    if (paymentDateFrom || paymentDateTo) {
      where.paymentDate = {};
      if (paymentDateFrom) {
        where.paymentDate.gte = new Date(paymentDateFrom);
      }
      if (paymentDateTo) {
        where.paymentDate.lte = new Date(paymentDateTo);
      }
    }

    if (locked !== undefined) {
      where.locked = locked;
    }

    if (search) {
      where.payrollNumber = { contains: search };
    }

    const orderBy = sortBy ? { [sortBy]: sortOrder || 'asc' } : { payPeriod: 'desc' };

    return this.repository.findAll({ skip, take: limit, where, orderBy });
  }

  async findById(id: string) {
    const header = await this.repository.findById(id);
    if (!header) {
      throw new NotFoundException(`Employee salary header with ID ${id} not found`);
    }
    return header;
  }

  async update(id: string, updateEmployeeSalaryHeaderDto: UpdateEmployeeSalaryHeaderDto) {
    const header = await this.findById(id);

    // Check if header is locked
    if (header.locked) {
      throw new ConflictException('Cannot modify locked payroll');
    }

    return this.repository.update(id, updateEmployeeSalaryHeaderDto);
  }

  async remove(id: string) {
    const header = await this.findById(id);

    // Check if header is locked
    if (header.locked) {
      throw new ConflictException('Cannot delete locked payroll');
    }

    return this.repository.softDelete(id);
  }

  async calculateSalary(id: string) {
    const header = await this.findById(id);

    if (header.locked) {
      throw new ConflictException('Cannot calculate locked payroll');
    }

    if (header.status !== PayrollStatus.DRAFT) {
      throw new ConflictException('Can only calculate payroll in DRAFT status');
    }

    // Use transaction to calculate salary
    await this.prisma.$transaction(async (tx) => {
      const details = await tx.employeeSalaryDetail.findMany({
        where: { salaryHeaderId: id },
        include: { component: true },
      });

      let basicSalary = 0;
      let totalAllowances = 0;
      let totalDeductions = 0;

      for (const detail of details) {
        const amount = this.calculateComponentAmount(detail, header);
        const componentType = detail.component.componentType;

        if (componentType === 'BASIC') {
          basicSalary += amount;
        } else if (['ALLOWANCE', 'BONUS', 'OVERTIME'].includes(componentType)) {
          totalAllowances += amount;
        } else if (['DEDUCTION', 'TAX', 'INSURANCE'].includes(componentType)) {
          totalDeductions += amount;
        }

        // Update detail amount
        await tx.employeeSalaryDetail.update({
          where: { id: detail.id },
          data: { amount },
        });
      }

      // Calculate net salary
      const netSalary = basicSalary + totalAllowances - totalDeductions;

      // Update header
      await tx.employeeSalaryHeader.update({
        where: { id },
        data: {
          basicSalary,
          totalAllowances,
          totalDeductions,
          netSalary,
          status: PayrollStatus.CALCULATED,
        },
      });
    });

    return this.findById(id);
  }

  private calculateComponentAmount(detail: any, header: any): number {
    const component = detail.component;
    const employee = header.employee;

    switch (component.calculationType) {
      case 'FIXED':
        return component.defaultValue || 0;

      case 'PERCENTAGE':
        const baseSalary = employee.basicSalary || 0;
        return (baseSalary * (component.percentageValue || 0)) / 100;

      case 'FORMULA':
        // For formula type, you would implement formula evaluation here
        // For now, return the manual override value or default
        return detail.amount || component.defaultValue || 0;

      default:
        return detail.amount || component.defaultValue || 0;
    }
  }

  async approveSalary(id: string, approverId: string) {
    const header = await this.findById(id);

    if (header.locked) {
      throw new ConflictException('Cannot approve locked payroll');
    }

    if (header.status !== PayrollStatus.CALCULATED) {
      throw new ConflictException('Can only approve payroll in CALCULATED status');
    }

    const updated = await this.repository.update(id, {
      status: PayrollStatus.APPROVED,
      locked: true,
    });

    // Create approval history
    await this.prisma.approvalHistory.create({
      data: {
        entityType: 'EMPLOYEE_SALARY',
        entityId: id,
        action: 'APPROVE',
        status: 'APPROVED',
        approvedBy: approverId,
        approvedAt: new Date(),
        comments: 'Payroll approved',
        createdBy: approverId,
      },
    });

    return updated;
  }

  async markAsPaid(id: string, paymentDate?: Date) {
    const header = await this.findById(id);

    if (header.status !== PayrollStatus.APPROVED) {
      throw new ConflictException('Can only mark approved payroll as paid');
    }

    return this.repository.update(id, {
      status: PayrollStatus.PAID,
      paymentDate: paymentDate || new Date(),
    });
  }
}
