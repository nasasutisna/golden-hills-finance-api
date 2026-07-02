import { Injectable, ConflictException, Logger } from '@nestjs/common';
import { QueryOptionsDto } from '../common/dto/query-options.dto';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeesRepository } from './employees.repository';

@Injectable()
export class EmployeesService {
  private readonly logger = new Logger(EmployeesService.name);

  constructor(private readonly employeesRepository: EmployeesRepository) {}

  async findAll(queryOptions: QueryOptionsDto) {
    const { page = 1, limit = 10, sortBy = 'firstName', sortOrder = 'asc', search, searchFields, filters } = queryOptions;

    const skip = (page - 1) * limit;

    let where: any = {};

    if (search && searchFields) {
      const fields = searchFields.split(',');
      where.OR = fields.map((field) => ({
        [field]: { contains: search, mode: 'insensitive' },
      }));
    }

    if (filters) {
      where = { ...where, ...filters };
    }

    const { employees, total } = await this.employeesRepository.findAll({
      skip,
      take: limit,
      where,
      orderBy: { [sortBy]: sortOrder },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: employees,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    };
  }

  async findById(id: string) {
    return await this.employeesRepository.findById(id);
  }

  async findByEmployeeCode(employeeCode: string) {
    const employee = await this.employeesRepository.findByEmployeeCode(employeeCode);
    if (!employee) {
      throw new ConflictException('Employee not found');
    }
    return employee;
  }

  async create(createEmployeeDto: CreateEmployeeDto) {
    // Check if employee code already exists
    const existingEmployee = await this.employeesRepository.findByEmployeeCode(
      createEmployeeDto.employeeCode,
    );
    if (existingEmployee) {
      throw new ConflictException('Employee code already exists');
    }

    try {
      const employee = await this.employeesRepository.create(createEmployeeDto);
      this.logger.log(`Employee created: ${employee.employeeCode}`);
      return employee;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error('Error creating employee:', error);
      throw error;
    }
  }

  async update(id: string, updateEmployeeDto: UpdateEmployeeDto) {
    try {
      const employee = await this.employeesRepository.update(id, updateEmployeeDto);
      this.logger.log(`Employee updated: ${employee.employeeCode}`);
      return employee;
    } catch (error) {
      this.logger.error('Error updating employee:', error);
      throw error;
    }
  }

  async softDelete(id: string) {
    const employee = await this.employeesRepository.softDelete(id);
    this.logger.log(`Employee soft deleted: ${employee.employeeCode}`);
    return employee;
  }

  async restore(id: string) {
    const employee = await this.employeesRepository.restore(id);
    this.logger.log(`Employee restored: ${employee.employeeCode}`);
    return employee;
  }

  async deactivate(id: string) {
    const employee = await this.employeesRepository.deactivate(id);
    this.logger.log(`Employee deactivated: ${employee.employeeCode}`);
    return employee;
  }

  async activate(id: string) {
    const employee = await this.employeesRepository.activate(id);
    this.logger.log(`Employee activated: ${employee.employeeCode}`);
    return employee;
  }

  async getByPosition(positionId: string) {
    return await this.employeesRepository.getByPosition(positionId);
  }

  async getByDepartment(department: string) {
    return await this.employeesRepository.getByDepartment(department);
  }

  async getByEmploymentStatus(status: string) {
    return await this.employeesRepository.getByEmploymentStatus(status);
  }

  async getEmployeeStatistics() {
    return await this.employeesRepository.getEmployeeStatistics();
  }

  async count(where?: any): Promise<number> {
    return await this.employeesRepository.count(where);
  }

  async exists(id: string): Promise<boolean> {
    return await this.employeesRepository.exists(id);
  }
}
