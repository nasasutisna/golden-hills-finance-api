import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { QueryOptionsDto } from '../common/dto/query-options.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RolesRepository } from './roles.repository';

@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);

  constructor(private readonly rolesRepository: RolesRepository) {}

  async findAll(queryOptions: QueryOptionsDto) {
    const { page = 1, limit = 10, sortBy = 'name', sortOrder = 'asc', search, searchFields, filters } = queryOptions;

    const skip = (page - 1) * limit;

    let where: any = {};

    // Add search filter
    if (search && searchFields) {
      const fields = searchFields.split(',');
      where.OR = fields.map((field) => ({
        [field]: { contains: search },
      }));
    }

    // Add additional filters
    if (filters) {
      where = { ...where, ...filters };
    }

    const { roles, total } = await this.rolesRepository.findAll({
      skip,
      take: limit,
      where,
      orderBy: { [sortBy]: sortOrder },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: roles,
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
    const role = await this.rolesRepository.findById(id);
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    return role;
  }

  async findByName(name: string) {
    return this.rolesRepository.findByName(name);
  }

  async create(createRoleDto: CreateRoleDto) {
    // Check if role name already exists
    const existingRole = await this.rolesRepository.findByName(createRoleDto.name);
    if (existingRole) {
      throw new ConflictException('Role name already exists');
    }

    const role = await this.rolesRepository.create(createRoleDto);
    this.logger.log(`Role created: ${role.name}`);
    return role;
  }

  async update(id: string, updateRoleDto: UpdateRoleDto) {
    // Check if role exists
    await this.findById(id);

    // Check if new name conflicts with existing role
    if (updateRoleDto.name) {
      const existingRole = await this.rolesRepository.findByName(updateRoleDto.name);
      if (existingRole && existingRole.id !== id) {
        throw new ConflictException('Role name already exists');
      }
    }

    const role = await this.rolesRepository.update(id, updateRoleDto);
    this.logger.log(`Role updated: ${role.name}`);
    return role;
  }

  async softDelete(id: string) {
    // Check if role exists
    await this.findById(id);

    const role = await this.rolesRepository.softDelete(id);
    this.logger.log(`Role soft deleted: ${role.name}`);
    return role;
  }

  async restore(id: string) {
    const role = await this.rolesRepository.restore(id);
    this.logger.log(`Role restored: ${role.name}`);
    return role;
  }

  async count(where?: any): Promise<number> {
    return this.rolesRepository.count(where);
  }

  async exists(id: string): Promise<boolean> {
    return this.rolesRepository.exists(id);
  }
}
