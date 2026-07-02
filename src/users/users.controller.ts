import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryOptionsDto } from '../common/dto/query-options.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ResponseDto } from '../common/dto/response.dto';
import { ParseUuidPipe } from '../common/pipes/parse-uuid.pipe';
import { ApiResponseDecorators } from '../common/decorators/http-response.decorator';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Create new user',
    description: 'Create a new user account (Admin only)',
  })
  @ApiResponseDecorators.created()
  @ApiResponseDecorators.standard()
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    return {
      statusCode: 201,
      message: 'User created successfully',
      data: user,
    };
  }

  @Get()
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({
    summary: 'Get all users',
    description: 'Get paginated list of users (Admin, Manager)',
  })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async findAll(@Query() queryOptions: QueryOptionsDto) {
    const result = await this.usersService.findAll(queryOptions);
    return {
      statusCode: 200,
      message: 'Users retrieved successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Get user information by ID',
  })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async findOne(@Param('id', ParseUuidPipe) id: string) {
    const user = await this.usersService.findById(id);
    return {
      statusCode: 200,
      message: 'User retrieved successfully',
      data: user,
    };
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Update user',
    description: 'Update user information (Admin only)',
  })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async update(
    @Param('id', ParseUuidPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const user = await this.usersService.update(id, updateUserDto);
    return {
      statusCode: 200,
      message: 'User updated successfully',
      data: user,
    };
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Soft delete user',
    description: 'Soft delete user account (Admin only)',
  })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async remove(@Param('id', ParseUuidPipe) id: string) {
    const user = await this.usersService.softDelete(id);
    return {
      statusCode: 200,
      message: 'User deleted successfully',
      data: user,
    };
  }

  @Patch(':id/restore')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Restore deleted user',
    description: 'Restore a soft deleted user (Admin only)',
  })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async restore(@Param('id', ParseUuidPipe) id: string) {
    const user = await this.usersService.restore(id);
    return {
      statusCode: 200,
      message: 'User restored successfully',
      data: user,
    };
  }

  @Patch(':id/deactivate')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Deactivate user',
    description: 'Deactivate user account (Admin only)',
  })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async deactivate(@Param('id', ParseUuidPipe) id: string) {
    const user = await this.usersService.deactivate(id);
    return {
      statusCode: 200,
      message: 'User deactivated successfully',
      data: user,
    };
  }

  @Patch(':id/activate')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Activate user',
    description: 'Activate user account (Admin only)',
  })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async activate(@Param('id', ParseUuidPipe) id: string) {
    const user = await this.usersService.activate(id);
    return {
      statusCode: 200,
      message: 'User activated successfully',
      data: user,
    };
  }
}
