import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SalaryComponent } from '@prisma/client';

@Injectable()
export class SalaryComponentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: any;
    orderBy?: any;
  }): Promise<{ components: SalaryComponent[]; total: number }> {
    const { skip, take, where, orderBy } = params;

    const [components, total] = await Promise.all([
      this.prisma.salaryComponent.findMany({
        where,
        skip,
        take,
        orderBy,
      }),
      this.prisma.salaryComponent.count({ where }),
    ]);

    return { components, total };
  }

  async findById(id: string): Promise<SalaryComponent | null> {
    return this.prisma.salaryComponent.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findByComponentCode(componentCode: string): Promise<SalaryComponent | null> {
    return this.prisma.salaryComponent.findFirst({
      where: { componentCode, deletedAt: null },
    });
  }

  async findActive(): Promise<SalaryComponent[]> {
    return this.prisma.salaryComponent.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { calculationOrder: 'asc' },
    });
  }

  async create(data: any): Promise<SalaryComponent> {
    return this.prisma.salaryComponent.create({
      data,
    });
  }

  async update(id: string, data: any): Promise<SalaryComponent> {
    const component = await this.findById(id);
    if (!component) {
      throw new NotFoundException(`Salary component with ID ${id} not found`);
    }

    return this.prisma.salaryComponent.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string): Promise<SalaryComponent> {
    const component = await this.findById(id);
    if (!component) {
      throw new NotFoundException(`Salary component with ID ${id} not found`);
    }

    return this.prisma.salaryComponent.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async count(where?: any): Promise<number> {
    return this.prisma.salaryComponent.count({ where });
  }
}
