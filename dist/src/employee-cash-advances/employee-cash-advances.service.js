"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeCashAdvancesService = void 0;
const common_1 = require("@nestjs/common");
const employee_cash_advances_repository_1 = require("./employee-cash-advances.repository");
const prisma_service_1 = require("../prisma/prisma.service");
const create_employee_cash_advance_dto_1 = require("./dto/create-employee-cash-advance.dto");
let EmployeeCashAdvancesService = class EmployeeCashAdvancesService {
    constructor(repository, prisma) {
        this.repository = repository;
        this.prisma = prisma;
    }
    async create(createEmployeeCashAdvanceDto, userId) {
        const existing = await this.repository.findByAdvanceNumber(createEmployeeCashAdvanceDto.advanceNumber);
        if (existing) {
            throw new common_1.ConflictException(`Cash advance with number ${createEmployeeCashAdvanceDto.advanceNumber} already exists`);
        }
        const employee = await this.prisma.employee.findFirst({
            where: { id: createEmployeeCashAdvanceDto.employeeId, deletedAt: null },
        });
        if (!employee) {
            throw new common_1.NotFoundException(`Employee with ID ${createEmployeeCashAdvanceDto.employeeId} not found`);
        }
        return this.repository.create({
            ...createEmployeeCashAdvanceDto,
            requestedBy: userId,
        });
    }
    async findAll(queryDto) {
        const { page = 1, limit = 10, sortBy, sortOrder, status, employeeId, dateFrom, dateTo, search } = queryDto;
        const skip = (page - 1) * limit;
        const where = { deletedAt: null };
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
                { advanceNumber: { contains: search } },
                { purpose: { contains: search } },
            ];
        }
        const orderBy = sortBy ? { [sortBy]: sortOrder || 'asc' } : { requestDate: 'desc' };
        return this.repository.findAll({ skip, take: limit, where, orderBy });
    }
    async findById(id) {
        const advance = await this.repository.findById(id);
        if (!advance) {
            throw new common_1.NotFoundException(`Employee cash advance with ID ${id} not found`);
        }
        return advance;
    }
    async findByEmployee(employeeId) {
        return this.repository.findByEmployee(employeeId);
    }
    async update(id, updateEmployeeCashAdvanceDto) {
        const advance = await this.findById(id);
        return this.repository.update(id, updateEmployeeCashAdvanceDto);
    }
    async remove(id) {
        await this.findById(id);
        return this.repository.softDelete(id);
    }
    async approveAdvance(id, approverId, notes) {
        const advance = await this.findById(id);
        if (advance.status !== create_employee_cash_advance_dto_1.AdvanceStatus.PENDING) {
            throw new common_1.ConflictException(`Cannot approve advance with status ${advance.status}`);
        }
        await this.prisma.$transaction(async (tx) => {
            await tx.employeeCashAdvance.update({
                where: { id },
                data: {
                    status: create_employee_cash_advance_dto_1.AdvanceStatus.APPROVED,
                    approvedBy: approverId,
                    approvedAt: new Date(),
                    approvalNotes: notes,
                },
            });
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
    async rejectAdvance(id, approverId, notes) {
        const advance = await this.findById(id);
        if (advance.status !== create_employee_cash_advance_dto_1.AdvanceStatus.PENDING) {
            throw new common_1.ConflictException(`Cannot reject advance with status ${advance.status}`);
        }
        await this.prisma.$transaction(async (tx) => {
            await tx.employeeCashAdvance.update({
                where: { id },
                data: {
                    status: create_employee_cash_advance_dto_1.AdvanceStatus.REJECTED,
                    approvedBy: approverId,
                    approvedAt: new Date(),
                    approvalNotes: notes,
                },
            });
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
    async disburseAdvance(id, disbursementDate) {
        const advance = await this.findById(id);
        if (advance.status !== create_employee_cash_advance_dto_1.AdvanceStatus.APPROVED) {
            throw new common_1.ConflictException('Can only disburse approved advances');
        }
        const updated = await this.repository.update(id, {
            status: create_employee_cash_advance_dto_1.AdvanceStatus.DISBURSED,
            disbursementDate: disbursementDate || new Date(),
        });
        const employeeName = advance.employee
            ? `${advance.employee.firstName} ${advance.employee.lastName}`
            : 'Employee';
        await this.prisma.cashTransaction.create({
            data: {
                transactionNumber: `TXN-ADV-${advance.advanceNumber}`,
                transactionDate: disbursementDate || new Date(),
                transactionType: 'EXPENSE',
                amount: advance.amount,
                categoryId: null,
                description: `Cash advance disbursement to ${employeeName} - ${advance.purpose}`,
                referenceType: 'EMPLOYEE_CASH_ADVANCE',
                referenceId: id,
                status: 'POSTED',
                createdBy: advance.approvedBy || advance.requestedBy,
            },
        });
        return updated;
    }
    async recordRepayment(id, amount, paymentDate, notes) {
        const advance = await this.findById(id);
        if (advance.status !== create_employee_cash_advance_dto_1.AdvanceStatus.DISBURSED && advance.status !== create_employee_cash_advance_dto_1.AdvanceStatus.PARTIALLY_REPAID) {
            throw new common_1.ConflictException('Can only record repayment for disbursed advances');
        }
        const totalRepaid = (advance.repayments || []).reduce((sum, r) => sum + r.amount, 0);
        const newTotalRepaid = totalRepaid + amount;
        if (newTotalRepaid > advance.amount) {
            throw new common_1.ConflictException('Repayment amount exceeds outstanding balance');
        }
        await this.prisma.$transaction(async (tx) => {
            await tx.cashAdvanceRepayment.create({
                data: {
                    advanceId: id,
                    amount,
                    paymentDate: paymentDate || new Date(),
                    notes,
                },
            });
            let newStatus = advance.status;
            if (newTotalRepaid >= advance.amount) {
                newStatus = create_employee_cash_advance_dto_1.AdvanceStatus.REPAID;
            }
            else if (newTotalRepaid > 0) {
                newStatus = create_employee_cash_advance_dto_1.AdvanceStatus.PARTIALLY_REPAID;
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
};
exports.EmployeeCashAdvancesService = EmployeeCashAdvancesService;
exports.EmployeeCashAdvancesService = EmployeeCashAdvancesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [employee_cash_advances_repository_1.EmployeeCashAdvancesRepository,
        prisma_service_1.PrismaService])
], EmployeeCashAdvancesService);
//# sourceMappingURL=employee-cash-advances.service.js.map