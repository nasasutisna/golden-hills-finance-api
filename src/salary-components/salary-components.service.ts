import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { SalaryComponentsRepository } from './salary-components.repository';
import { CreateSalaryComponentDto } from './dto/create-salary-component.dto';
import { UpdateSalaryComponentDto } from './dto/update-salary-component.dto';
import { QuerySalaryComponentsDto } from './dto/query-salary-components.dto';

@Injectable()
export class SalaryComponentsService {
  constructor(private readonly repository: SalaryComponentsRepository) {}

  async create(createSalaryComponentDto: CreateSalaryComponentDto) {
    // Check if component code already exists
    const existing = await this.repository.findByComponentCode(createSalaryComponentDto.componentCode);
    if (existing) {
      throw new ConflictException(`Component with code ${createSalaryComponentDto.componentCode} already exists`);
    }

    return this.repository.create(createSalaryComponentDto);
  }

  async findAll(queryDto: QuerySalaryComponentsDto) {
    const { page = 1, limit = 10, sortBy, sortOrder, componentType, calculationType, isActive, isTaxSubject, search } = queryDto;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };

    if (componentType) {
      where.componentType = componentType;
    }

    if (calculationType) {
      where.calculationType = calculationType;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (isTaxSubject !== undefined) {
      where.isTaxSubject = isTaxSubject;
    }

    if (search) {
      where.OR = [
        { componentCode: { contains: search, mode: 'insensitive' } },
        { componentName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy = sortBy ? { [sortBy]: sortOrder || 'asc' } : { calculationOrder: 'asc' };

    return this.repository.findAll({ skip, take: limit, where, orderBy });
  }

  async findById(id: string) {
    const component = await this.repository.findById(id);
    if (!component) {
      throw new NotFoundException(`Salary component with ID ${id} not found`);
    }
    return component;
  }

  async update(id: string, updateSalaryComponentDto: UpdateSalaryComponentDto) {
    // If updating component code, check if new code already exists
    if (updateSalaryComponentDto.componentCode) {
      const existing = await this.repository.findByComponentCode(updateSalaryComponentDto.componentCode);
      if (existing && existing.id !== id) {
        throw new ConflictException(`Component with code ${updateSalaryComponentDto.componentCode} already exists`);
      }
    }

    return this.repository.update(id, updateSalaryComponentDto);
  }

  async remove(id: string) {
    await this.findById(id);
    return this.repository.softDelete(id);
  }

  async getActiveComponents() {
    return this.repository.findActive();
  }
}
