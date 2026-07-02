import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SalaryComponentsService } from './salary-components.service';
import { CreateSalaryComponentDto } from './dto/create-salary-component.dto';
import { UpdateSalaryComponentDto } from './dto/update-salary-component.dto';
import { QuerySalaryComponentsDto } from './dto/query-salary-components.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Salary Components')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('salary-components')
export class SalaryComponentsController {
  constructor(private readonly salaryComponentsService: SalaryComponentsService) {}

  @Post()
  @Roles('ADMIN', 'ACCOUNTANT', 'MANAGER')
  @ApiOperation({ summary: 'Create a new salary component' })
  @ApiResponse({ status: 201, description: 'Salary component created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'Component code already exists' })
  create(@Body() createSalaryComponentDto: CreateSalaryComponentDto) {
    return this.salaryComponentsService.create(createSalaryComponentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all salary components with pagination' })
  @ApiResponse({ status: 200, description: 'Salary components retrieved successfully' })
  findAll(@Query() queryDto: QuerySalaryComponentsDto) {
    return this.salaryComponentsService.findAll(queryDto);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get all active salary components' })
  @ApiResponse({ status: 200, description: 'Active salary components retrieved successfully' })
  getActiveComponents() {
    return this.salaryComponentsService.getActiveComponents();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get salary component by ID' })
  @ApiResponse({ status: 200, description: 'Salary component retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Salary component not found' })
  findById(@Param('id') id: string) {
    return this.salaryComponentsService.findById(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'ACCOUNTANT', 'MANAGER')
  @ApiOperation({ summary: 'Update salary component' })
  @ApiResponse({ status: 200, description: 'Salary component updated successfully' })
  @ApiResponse({ status: 404, description: 'Salary component not found' })
  update(@Param('id') id: string, @Body() updateSalaryComponentDto: UpdateSalaryComponentDto) {
    return this.salaryComponentsService.update(id, updateSalaryComponentDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete salary component' })
  @ApiResponse({ status: 200, description: 'Salary component deleted successfully' })
  @ApiResponse({ status: 404, description: 'Salary component not found' })
  remove(@Param('id') id: string) {
    return this.salaryComponentsService.remove(id);
  }
}
