import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { EmployeeCashAdvancesRepository } from './employee-cash-advances.repository';
import { CreateEmployeeCashAdvanceDto } from './dto/create-employee-cash-advance.dto';
import { UpdateEmployeeCashAdvanceDto } from './dto/update-employee-cash-advance.dto';
import { QueryEmployeeCashAdvancesDto } from './dto/query-employee-cash-advances.dto';
import { PrismaService } from '../prisma/prisma.service';
import { AdvanceStatus } from './dto/create-employee-cash-advance.dto';

@Injectable()
export class EmployeeCashAdvancesService {
  constructor(
    private readonly repository: EmployeeCashAdvancesRepository,
    private readonly prisma: PrismaService,
  ) {}

  async create(createEmployeeCashAdvanceDto: CreateEmployeeCashAdvanceDto, userId: string) {
    // Check if advance number already exists
    const existing = await this.repository.findByAdvanceNumber(createEmployeeCashAdvanceDto.advanceNumber);
    if (existing) {
      throw new ConflictException(`Cash advance with number ${createEmployeeCashAdvanceDto.advanceNumber} already exists`);
    }

    // Check if employee exists
    const employee = await this.prisma.employee.findFirst({
      where: { id: createEmployeeCashAdvanceDto.employeeId, deletedAt: null },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${createEmployeeCashAdvanceDto.employeeId} not found`);
    }

    return this.repository.create({
      ...createEmployeeCashAdvanceDto,
      requestedBy: userId,
    });
  }

  async findAll(queryDto: QueryEmployeeCashAdvancesDto) {
    const { page = 1, limit = 10, sortBy, sortOrder, status, employeeId, dateFrom, dateTo, search } = queryDto;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };

    if (status) {
      where.status = status;
    }

    if (employeeId) {
      where.employeeId = employeeId;
    }

    if (dateFrom || dateTo) {
      where.requestDate = {};
      if (dateFrom) {
        where.requestDate.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.requestDate.lte = new Date(dateTo);
      }
    }

    if (search) {
      where.OR = [
        { advanceNumber: { contains: search, mode: 'insensitive' } },
        { purpose: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy = sortBy ? { [sortBy]: sortOrder || 'asc' } : { requestDate: 'desc' };

    return this.repository.findAll({ skip, take: limit, where, orderBy });
  }

  async findById(id: string) {
    const advance = await this.repository.findById(id);
    if (!advance) {
      throw new NotFoundException(`Employee cash advance with ID ${id} not found`);
    }
    return advance;
  }

  async findByEmployee(employeeId: string) {
    return this.repository.findByEmployee(employeeId);
  }

  async update(id: string, updateEmployeeCashAdvanceDto: UpdateEmployeeCashAdvanceDto) {
    const advance = await this.findById(id);
    return this.repository.update(id, updateEmployeeCashAdvanceDto);
  }

  async remove(id: string) {
    await this.findById(id);
    return this.repository.softDelete(id);
  }

  async approveAdvance(id: string, approverId: string, notes?: string) {
    const advance = await this.findById(id);

    if (advance.status !== AdvanceStatus.PENDING) {
      throw new ConflictException(`Cannot approve advance with status ${advance.status}`);
    }

    // Use transaction to update advance and create approval history
    await this.prisma.$transaction(async (tx) => {
      // Update advance status
      await tx.employeeCashAdvance.update({
        where: { id },
        data: {
          status: AdvanceStatus.APPROVED,
          approvedBy: approverId,
          approvedAt: new Date(),
          approvalNotes: notes,
        },
      });

      // Create approval history
      await tx.approvalHistory.create({
        data: {
          entityType: 'EMPLOYEE_CASH_ADVANCE',
          entityId: id,
          action: 'APPROVE',
          status: 'APPROVED',
          approvedBy: approverId,
          approvedAt: new Date(),
          comments: notes || 'Cash advance approved',
          createdBy: approverId,
        },
      });
    });

    return this.findById(id);
  }

  async rejectAdvance(id: string, approverId: string, notes?: string) {
    const advance = await this.findById(id);

    if (advance.status !== AdvanceStatus.PENDING) {
      throw new ConflictException(`Cannot reject advance with status ${advance.status}`);
    }

    // Use transaction to update advance and create approval history
    await this.prisma.$transaction(async (tx) => {
      // Update advance status
      await tx.employeeCashAdvance.update({
        where: { id },
        data: {
          status: AdvanceStatus.REJECTED,
          approvedBy: approverId,
          approvedAt: new Date(),
          approvalNotes: notes,
        },
      });

      // Create approval history
      await tx.approvalHistory.create({
        data: {
          entityType: 'EMPLOYEE_CASH_ADVANCE',
          entityId: id,
          action: 'REJECT',
          status: 'REJECTED',
          approvedBy: approverId,
          approvedAt: new Date(),
          comments: notes || 'Cash advance rejected',
          createdBy: approverId,
        },
      });
    });

    return this.findById(id);
  }

  async disburseAdvance(id: string, disbursementDate?: Date) {
    const advance = await this.findById(id);

    if (advance.status !== AdvanceStatus.APPROVED) {
      throw new ConflictException('Can only disburse approved advances');
    }

    const updated = await this.repository.update(id, {
      status: AdvanceStatus.DISBURSED,
      disbursementDate: disbursementDate || new Date(),
    });

    // Create cash transaction for disbursement
    const employeeName = advance.employee
      ? `${advance.employee.firstName} ${advance.employee.lastName}`
      : 'Employee';

    await this.prisma.cashTransaction.create({
      data: {
        transactionNumber: `TXN-ADV-${advance.advanceNumber}`,
        transactionDate: disbursementDate || new Date(),
        transactionType: 'EXPENSE',
        amount: advance.amount,
        categoryId: null, // You may want to add a category for cash advances
        description: `Cash advance disbursement to ${employeeName} - ${advance.purpose}`,
        referenceType: 'EMPLOYEE_CASH_ADVANCE',
        referenceId: id,
        status: 'POSTED',
        createdBy: advance.approvedBy || advance.requestedBy,
      },
    });

    return updated;
  }

  async recordRepayment(id: string, amount: number, paymentDate?: Date, notes?: string) {
    const advance = await this.findById(id);

    if (advance.status !== AdvanceStatus.DISBURSED && advance.status !== AdvanceStatus.PARTIALLY_REPAID) {
      throw new ConflictException('Can only record repayment for disbursed advances');
    }

    // Calculate total repaid
    const totalRepaid = ((advance.repayments as Array<{ amount: number }> | undefined) || []).reduce(
      (sum: number, r: { amount: number }) => sum + r.amount,
      0,
    );
    const newTotalRepaid = totalRepaid + amount;

    if (newTotalRepaid > advance.amount) {
      throw new ConflictException('Repayment amount exceeds outstanding balance');
    }

    // Use transaction to create repayment and update advance
    await this.prisma.$transaction(async (tx) => {
      // Create repayment record
      await tx.cashAdvanceRepayment.create({
        data: {
          advanceId: id,
          amount,
          paymentDate: paymentDate || new Date(),
          notes,
        },
      });

      // Update advance status
      let newStatus = advance.status;
      if (newTotalRepaid >= advance.amount) {
        newStatus = AdvanceStatus.REPAID;
      } else if (newTotalRepaid > 0) {
        newStatus = AdvanceStatus.PARTIALLY_REPAID;
      }

      await tx.employeeCashAdvance.update({
        where: { id },
        data: {
          status: newStatus,
        },
      });
    });

    return this.findById(id);
  }

  async findPendingApproval() {
    return this.repository.findPendingApproval();
  }
}
