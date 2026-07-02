import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { EmployeeSalaryDetailsRepository } from './employee-salary-details.repository';
import { CreateEmployeeSalaryDetailDto } from './dto/create-employee-salary-detail.dto';
import { UpdateEmployeeSalaryDetailDto } from './dto/update-employee-salary-detail.dto';
import { QueryEmployeeSalaryDetailsDto } from './dto/query-employee-salary-details.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EmployeeSalaryDetailsService {
  constructor(
    private readonly repository: EmployeeSalaryDetailsRepository,
    private readonly prisma: PrismaService,
  ) {}

  async create(createEmployeeSalaryDetailDto: CreateEmployeeSalaryDetailDto) {
    // Check if salary header exists and is not locked
    const header = await this.prisma.employeeSalaryHeader.findFirst({
      where: { id: createEmployeeSalaryDetailDto.salaryHeaderId, deletedAt: null },
    });

    if (!header) {
      throw new NotFoundException(`Salary header with ID ${createEmployeeSalaryDetailDto.salaryHeaderId} not found`);
    }

    if (header.locked) {
      throw new ConflictException('Cannot add details to locked payroll');
    }

    // Check if salary component exists
    const component = await this.prisma.salaryComponent.findFirst({
      where: { id: createEmployeeSalaryDetailDto.componentId, deletedAt: null },
    });

    if (!component) {
      throw new NotFoundException(`Salary component with ID ${createEmployeeSalaryDetailDto.componentId} not found`);
    }

    // Check if this component already exists for this header
    const existing = await this.prisma.employeeSalaryDetail.findFirst({
      where: {
        salaryHeaderId: createEmployeeSalaryDetailDto.salaryHeaderId,
        componentId: createEmployeeSalaryDetailDto.componentId,
        deletedAt: null,
      },
    });

    if (existing) {
      throw new ConflictException('This salary component already exists for this salary header');
    }

    return this.repository.create(createEmployeeSalaryDetailDto);
  }

  async findAll(queryDto: QueryEmployeeSalaryDetailsDto) {
    const { page = 1, limit = 10, sortBy, sortOrder, salaryHeaderId, salaryComponentId, manualOverride } = queryDto;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };

    if (salaryHeaderId) {
      where.salaryHeaderId = salaryHeaderId;
    }

    if (salaryComponentId) {
      where.salaryComponentId = salaryComponentId;
    }

    if (manualOverride !== undefined) {
      where.manualOverride = manualOverride;
    }

    const orderBy = sortBy ? { [sortBy]: sortOrder || 'asc' } : { createdAt: 'asc' };

    return this.repository.findAll({ skip, take: limit, where, orderBy });
  }

  async findById(id: string) {
    const detail = await this.repository.findById(id);
    if (!detail) {
      throw new NotFoundException(`Employee salary detail with ID ${id} not found`);
    }
    return detail;
  }

  async findBySalaryHeader(salaryHeaderId: string) {
    return this.repository.findBySalaryHeader(salaryHeaderId);
  }

  async update(id: string, updateEmployeeSalaryDetailDto: UpdateEmployeeSalaryDetailDto) {
    const detail = await this.findById(id);

    // Check if header is locked
    const header = await this.prisma.employeeSalaryHeader.findFirst({
      where: { id: detail.salaryHeaderId, deletedAt: null },
    });

    if (header && header.locked) {
      throw new ConflictException('Cannot modify details of locked payroll');
    }

    return this.repository.update(id, updateEmployeeSalaryDetailDto);
  }

  async remove(id: string) {
    const detail = await this.findById(id);

    // Check if header is locked
    const header = await this.prisma.employeeSalaryHeader.findFirst({
      where: { id: detail.salaryHeaderId, deletedAt: null },
    });

    if (header && header.locked) {
      throw new ConflictException('Cannot delete details from locked payroll');
    }

    return this.repository.softDelete(id);
  }
}
