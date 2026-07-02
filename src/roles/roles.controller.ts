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
} from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { QueryOptionsDto } from '../common/dto/query-options.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ParseUuidPipe } from '../common/pipes/parse-uuid.pipe';
import { ApiResponseDecorators } from '../common/decorators/http-response.decorator';

@ApiTags('Roles')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Create new role',
    description: 'Create a new role (Admin only)',
  })
  @ApiResponseDecorators.created()
  @ApiResponseDecorators.standard()
  async create(@Body() createRoleDto: CreateRoleDto) {
    const role = await this.rolesService.create(createRoleDto);
    return {
      statusCode: 201,
      message: 'Role created successfully',
      data: role,
    };
  }

  @Get()
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({
    summary: 'Get all roles',
    description: 'Get paginated list of roles (Admin, Manager)',
  })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async findAll(@Query() queryOptions: QueryOptionsDto) {
    const result = await this.rolesService.findAll(queryOptions);
    return {
      statusCode: 200,
      message: 'Roles retrieved successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get role by ID',
    description: 'Get role information by ID',
  })
  @ApiParam({ name: 'id', description: 'Role ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async findOne(@Param('id', ParseUuidPipe) id: string) {
    const role = await this.rolesService.findById(id);
    return {
      statusCode: 200,
      message: 'Role retrieved successfully',
      data: role,
    };
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Update role',
    description: 'Update role information (Admin only)',
  })
  @ApiParam({ name: 'id', description: 'Role ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async update(
    @Param('id', ParseUuidPipe) id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    const role = await this.rolesService.update(id, updateRoleDto);
    return {
      statusCode: 200,
      message: 'Role updated successfully',
      data: role,
    };
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Soft delete role',
    description: 'Soft delete role (Admin only)',
  })
  @ApiParam({ name: 'id', description: 'Role ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async remove(@Param('id', ParseUuidPipe) id: string) {
    const role = await this.rolesService.softDelete(id);
    return {
      statusCode: 200,
      message: 'Role deleted successfully',
      data: role,
    };
  }

  @Patch(':id/restore')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Restore deleted role',
    description: 'Restore a soft deleted role (Admin only)',
  })
  @ApiParam({ name: 'id', description: 'Role ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async restore(@Param('id', ParseUuidPipe) id: string) {
    const role = await this.rolesService.restore(id);
    return {
      statusCode: 200,
      message: 'Role restored successfully',
      data: role,
    };
  }
}
