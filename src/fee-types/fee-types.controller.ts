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
import { FeeTypesService } from './fee-types.service';
import { CreateFeeTypeDto } from './dto/create-fee-type.dto';
import { UpdateFeeTypeDto } from './dto/update-fee-type.dto';
import { QueryOptionsDto } from '../common/dto/query-options.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ParseUuidPipe } from '../common/pipes/parse-uuid.pipe';
import { ApiResponseDecorators } from '../common/decorators/http-response.decorator';

@ApiTags('Fee Types')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('fee-types')
export class FeeTypesController {
  constructor(private readonly feeTypesService: FeeTypesService) {}

  @Post()
  @Roles('ADMIN', 'ACCOUNTANT')
  @ApiOperation({
    summary: 'Create new fee type',
    description: 'Create a new fee type',
  })
  @ApiResponseDecorators.created()
  @ApiResponseDecorators.standard()
  async create(@Body() createFeeTypeDto: CreateFeeTypeDto) {
    const feeType = await this.feeTypesService.create(createFeeTypeDto);
    return {
      statusCode: 201,
      message: 'Fee type created successfully',
      data: feeType,
    };
  }

  @Get()
  @ApiOperation({
    summary: 'Get all fee types',
    description: 'Get paginated list of fee types',
  })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async findAll(@Query() queryOptions: QueryOptionsDto) {
    const result = await this.feeTypesService.findAll(queryOptions);
    return {
      statusCode: 200,
      message: 'Fee types retrieved successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get('active')
  @ApiOperation({
    summary: 'Get active fee types',
    description: 'Get all active fee types',
  })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async getActive() {
    const feeTypes = await this.feeTypesService.getActiveFeeTypes();
    return {
      statusCode: 200,
      message: 'Active fee types retrieved successfully',
      data: feeTypes,
    };
  }

  @Get('category/:category')
  @ApiOperation({
    summary: 'Get fee types by category',
    description: 'Get fee types by category',
  })
  @ApiParam({ name: 'category', description: 'Fee category' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async getByCategory(@Param('category') category: string) {
    const feeTypes = await this.feeTypesService.getByCategory(category);
    return {
      statusCode: 200,
      message: 'Fee types retrieved successfully',
      data: feeTypes,
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get fee type by ID',
    description: 'Get fee type information by ID',
  })
  @ApiParam({ name: 'id', description: 'Fee Type ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async findOne(@Param('id', ParseUuidPipe) id: string) {
    const feeType = await this.feeTypesService.findById(id);
    return {
      statusCode: 200,
      message: 'Fee type retrieved successfully',
      data: feeType,
    };
  }

  @Patch(':id')
  @Roles('ADMIN', 'ACCOUNTANT')
  @ApiOperation({
    summary: 'Update fee type',
    description: 'Update fee type information',
  })
  @ApiParam({ name: 'id', description: 'Fee Type ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async update(
    @Param('id', ParseUuidPipe) id: string,
    @Body() updateFeeTypeDto: UpdateFeeTypeDto,
  ) {
    const feeType = await this.feeTypesService.update(id, updateFeeTypeDto);
    return {
      statusCode: 200,
      message: 'Fee type updated successfully',
      data: feeType,
    };
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Soft delete fee type',
    description: 'Soft delete fee type',
  })
  @ApiParam({ name: 'id', description: 'Fee Type ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async remove(@Param('id', ParseUuidPipe) id: string) {
    const feeType = await this.feeTypesService.softDelete(id);
    return {
      statusCode: 200,
      message: 'Fee type deleted successfully',
      data: feeType,
    };
  }

  @Patch(':id/restore')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Restore deleted fee type',
    description: 'Restore a soft deleted fee type',
  })
  @ApiParam({ name: 'id', description: 'Fee Type ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async restore(@Param('id', ParseUuidPipe) id: string) {
    const feeType = await this.feeTypesService.restore(id);
    return {
      statusCode: 200,
      message: 'Fee type restored successfully',
      data: feeType,
    };
  }
}
