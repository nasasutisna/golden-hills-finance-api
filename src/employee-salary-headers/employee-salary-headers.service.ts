import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { EmployeeSalaryHeadersRepository } from './employee-salary-headers.repository';
import { CreateEmployeeSalaryHeaderDto } from './dto/create-employee-salary-header.dto';
import { UpdateEmployeeSalaryHeaderDto } from './dto/update-employee-salary-header.dto';
import { QueryEmployeeSalaryHeadersDto } from './dto/query-employee-salary-headers.dto';
import { CreateSimplePayrollDto } from './dto/create-simple-payroll.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CashTransactionsService } from '../cash-transactions/cash-transactions.service';
import { REFERENCE_TYPES } from '../common/constants/reference-types';
import { PayrollStatus } from './dto/create-employee-salary-header.dto';

@Injectable()
export class EmployeeSalaryHeadersService {
  constructor(
    private readonly repository: EmployeeSalaryHeadersRepository,
    private readonly prisma: PrismaService,
    private readonly cashTransactionsService: CashTransactionsService,
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

    // Attach the linked Kas IPL expense posted when this payroll was paid
    // (polymorphic link: referenceType=SALARY + referenceId=header id).
    const cashTransaction = await this.prisma.cashTransaction.findFirst({
      where: {
        referenceType: REFERENCE_TYPES.SALARY,
        referenceId: id,
        deletedAt: null,
      },
      select: {
        id: true,
        transactionNumber: true,
        transactionDate: true,
        transactionType: true,
        amount: true,
        status: true,
        description: true,
        category: {
          select: { id: true, categoryCode: true, categoryName: true, fundType: true },
        },
        cashAccount: {
          select: { id: true, accountCode: true, accountName: true },
        },
      },
    });

    return { ...header, cashTransaction };
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

  /**
   * Simple flat-amount payroll: create a PAID salary header AND post the
   * matching IPL EXPENSE (category GAJI → Kas IPL) in one atomic transaction.
   * payrollNumber is auto-generated; the form only collects employee, period,
   * net salary, payment date, and optional notes.
   */
  async createSimplePayroll(dto: CreateSimplePayrollDto, userId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: dto.employeeId, deletedAt: null },
      include: { position: true },
    });
    if (!employee) {
      throw new NotFoundException(`Employee with ID ${dto.employeeId} not found`);
    }

    const existing = await this.repository.findByEmployeeAndPeriod(
      dto.employeeId,
      dto.payPeriod,
    );
    if (existing && existing.status !== PayrollStatus.CANCELLED) {
      throw new ConflictException(
        `Gaji untuk karyawan ini di periode ${dto.payPeriod} sudah ada`,
      );
    }

    // payrollNumber must be unique even if a cancelled payroll for the same
    // employee+period exists (undo → re-pay scenario). Append -2, -3, ... as needed.
    const base = `PAY-${dto.payPeriod}-${employee.employeeCode}`;
    let payrollNumber = base;
    let seq = 2;
    while (await this.repository.findByPayrollNumber(payrollNumber)) {
      payrollNumber = `${base}-${seq++}`;
    }

    return await this.prisma.executeInTransaction(async (tx) => {
      const header = await tx.employeeSalaryHeader.create({
        data: {
          payrollNumber,
          employeeId: dto.employeeId,
          payPeriod: dto.payPeriod,
          paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : new Date(),
          basicSalary: dto.netSalary,
          totalAllowances: 0,
          totalDeductions: 0,
          netSalary: dto.netSalary,
          status: PayrollStatus.PAID,
          locked: true,
          notes: dto.notes,
          createdBy: userId,
        },
        include: { employee: { include: { position: true } } },
      });

      // Post the IPL expense (Kas IPL) atomically with the header create.
      const cashTransaction = await this.cashTransactionsService.createFromSalaryHeader(
        header,
        userId,
        tx as any,
      );

      return { ...header, cashTransaction };
    });
  }

  async markAsPaid(id: string, paymentDate?: Date, paidBy?: string) {
    return await this.prisma.executeInTransaction(async (tx) => {
      const header = await tx.employeeSalaryHeader.findFirst({
        where: { id, deletedAt: null },
        include: {
          employee: { include: { position: true } },
          details: { include: { component: true } },
        },
      });
      if (!header) {
        throw new NotFoundException(`Employee salary header with ID ${id} not found`);
      }

      if (header.status !== PayrollStatus.APPROVED) {
        throw new ConflictException('Can only mark approved payroll as paid');
      }

      const updated = await tx.employeeSalaryHeader.update({
        where: { id },
        data: {
          status: PayrollStatus.PAID,
          paymentDate: paymentDate || new Date(),
        },
        include: {
          employee: { include: { position: true } },
          details: { include: { component: true } },
        },
      });

      // Post the IPL expense (Kas IPL) atomically with the status flip.
      if (paidBy) {
        await this.cashTransactionsService.createFromSalaryHeader(
          updated,
          paidBy,
          tx as any,
        );
      }

      return updated;
    });
  }

  /**
   * Undo a paid payroll: mark the header CANCELLED (audit trail preserved)
   * and soft-delete the linked Kas IPL expense in one atomic transaction.
   * Soft-deleting the expense removes it from the Kas IPL report and restores
   * the saldo (reports filter deletedAt: null via baseLedgerWhere).
   */
  async cancelPayroll(id: string, cancelledBy: string, reason?: string) {
    return await this.prisma.executeInTransaction(async (tx) => {
      const header = await tx.employeeSalaryHeader.findFirst({
        where: { id, deletedAt: null },
        include: {
          employee: { include: { position: true } },
          details: { include: { component: true } },
        },
      });
      if (!header) {
        throw new NotFoundException(`Employee salary header with ID ${id} not found`);
      }
      if (header.status === PayrollStatus.CANCELLED) {
        throw new ConflictException('Penggajian sudah dibatalkan');
      }
      if (header.status !== PayrollStatus.PAID) {
        throw new ConflictException('Hanya penggajian berstatus PAID yang bisa dibatalkan');
      }

      // Find & soft-delete the linked Kas IPL expense (atomic).
      const cashTx = await tx.cashTransaction.findFirst({
        where: { referenceType: REFERENCE_TYPES.SALARY, referenceId: id, deletedAt: null },
        select: { id: true, transactionNumber: true },
      });
      if (cashTx) {
        await tx.cashTransaction.update({
          where: { id: cashTx.id },
          data: { deletedAt: new Date() },
        });
      }

      // Mark header cancelled.
      const updated = await tx.employeeSalaryHeader.update({
        where: { id },
        data: { status: PayrollStatus.CANCELLED, locked: true },
        include: {
          employee: { include: { position: true } },
          details: { include: { component: true } },
        },
      });

      // Audit history.
      await tx.approvalHistory.create({
        data: {
          entityType: 'EMPLOYEE_SALARY',
          entityId: id,
          action: 'CANCEL',
          status: 'CANCELLED',
          approvedBy: cancelledBy,
          approvedAt: new Date(),
          comments:
            reason?.trim() ||
            (cashTx
              ? `Pembatalan penggajian; transaksi Kas IPL ${cashTx.transactionNumber} dihapus`
              : 'Pembatalan penggajian'),
          createdBy: cancelledBy,
        },
      });

      return {
        ...updated,
        cancelledCashTransactionNumber: cashTx?.transactionNumber ?? null,
      };
    });
  }
}
