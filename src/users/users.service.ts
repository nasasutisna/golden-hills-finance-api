import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { QueryOptionsDto } from '../common/dto/query-options.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly usersRepository: UsersRepository) {}

  async findAll(queryOptions: QueryOptionsDto) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', search, searchFields, filters } = queryOptions;

    const skip = (page - 1) * limit;

    let where: any = {};

    // Add search filter
    if (search && searchFields) {
      const fields = searchFields.split(',');
      where.OR = fields.map((field) => ({
        [field]: { contains: search, mode: 'insensitive' },
      }));
    }

    // Add additional filters
    if (filters) {
      where = { ...where, ...filters };
    }

    const { users, total } = await this.usersRepository.findAll({
      skip,
      take: limit,
      where,
      orderBy: { [sortBy]: sortOrder },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: users.map((user) => this.excludeSensitiveData(user)),
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
    const user = await this.usersRepository.findById(id);
    return this.excludeSensitiveData(user);
  }

  async findByUsername(username: string) {
    const user = await this.usersRepository.findByUsername(username);
    return user ?? null;
  }

  async findByEmail(email: string) {
    return this.usersRepository.findByEmail(email);
  }

  async create(createUserDto: CreateUserDto) {
    try {
      const user = await this.usersRepository.create(createUserDto);
      this.logger.log(`User created: ${user.username}`);
      return this.excludeSensitiveData(user);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error('Error creating user:', error);
      throw error;
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    try {
      const user = await this.usersRepository.update(id, updateUserDto);
      this.logger.log(`User updated: ${user.username}`);
      return this.excludeSensitiveData(user);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Error updating user:', error);
      throw error;
    }
  }

  async softDelete(id: string) {
    const user = await this.usersRepository.softDelete(id);
    this.logger.log(`User soft deleted: ${user.username}`);
    return this.excludeSensitiveData(user);
  }

  async restore(id: string) {
    const user = await this.usersRepository.restore(id);
    this.logger.log(`User restored: ${user.username}`);
    return this.excludeSensitiveData(user);
  }

  async deactivate(id: string) {
    const user = await this.usersRepository.update(id, { isActive: false });
    this.logger.log(`User deactivated: ${user.username}`);
    return this.excludeSensitiveData(user);
  }

  async activate(id: string) {
    const user = await this.usersRepository.update(id, { isActive: true });
    this.logger.log(`User activated: ${user.username}`);
    return this.excludeSensitiveData(user);
  }

  async updatePassword(id: string, newPassword: string) {
    await this.usersRepository.updatePassword(id, newPassword);
    this.logger.log(`Password updated for user: ${id}`);
  }

  private excludeSensitiveData(user: any) {
    const { password, refreshToken, refreshTokenExpiry, ...safeUser } = user;
    return safeUser;
  }

  async count(where?: any): Promise<number> {
    return this.usersRepository.count(where);
  }

  async exists(id: string): Promise<boolean> {
    return this.usersRepository.exists(id);
  }
}
