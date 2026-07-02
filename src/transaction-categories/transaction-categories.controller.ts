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
import { TransactionCategoriesService } from './transaction-categories.service';
import { CreateTransactionCategoryDto } from './dto/create-transaction-category.dto';
import { UpdateTransactionCategoryDto } from './dto/update-transaction-category.dto';
import { QueryOptionsDto } from '../common/dto/query-options.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ParseUuidPipe } from '../common/pipes/parse-uuid.pipe';
import { ApiResponseDecorators } from '../common/decorators/http-response.decorator';

@ApiTags('Transaction Categories')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('transaction-categories')
export class TransactionCategoriesController {
  constructor(private readonly transactionCategoriesService: TransactionCategoriesService) {}

  @Post()
  @Roles('ADMIN', 'ACCOUNTANT')
  @ApiOperation({
    summary: 'Create new transaction category',
    description: 'Create a new transaction category',
  })
  @ApiResponseDecorators.created()
  @ApiResponseDecorators.standard()
  async create(@Body() createTransactionCategoryDto: CreateTransactionCategoryDto) {
    const category = await this.transactionCategoriesService.create(createTransactionCategoryDto);
    return {
      statusCode: 201,
      message: 'Transaction category created successfully',
      data: category,
    };
  }

  @Get()
  @ApiOperation({
    summary: 'Get all transaction categories',
    description: 'Get paginated list of transaction categories',
  })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async findAll(@Query() queryOptions: QueryOptionsDto) {
    const result = await this.transactionCategoriesService.findAll(queryOptions);
    return {
      statusCode: 200,
      message: 'Transaction categories retrieved successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get('active')
  @ApiOperation({
    summary: 'Get active transaction categories',
    description: 'Get all active transaction categories',
  })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async getActive() {
    const categories = await this.transactionCategoriesService.getActiveCategories();
    return {
      statusCode: 200,
      message: 'Active transaction categories retrieved successfully',
      data: categories,
    };
  }

  @Get('type/:categoryType')
  @ApiOperation({
    summary: 'Get categories by type',
    description: 'Get transaction categories by type (INCOME/EXPENSE)',
  })
  @ApiParam({ name: 'categoryType', description: 'Category type' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async getByType(@Param('categoryType') categoryType: string) {
    const categories = await this.transactionCategoriesService.getByType(categoryType);
    return {
      statusCode: 200,
      message: 'Transaction categories retrieved successfully',
      data: categories,
    };
  }

  @Get('parent')
  @ApiOperation({
    summary: 'Get parent categories',
    description: 'Get all parent transaction categories',
  })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async getParentCategories() {
    const categories = await this.transactionCategoriesService.getParentCategories();
    return {
      statusCode: 200,
      message: 'Parent categories retrieved successfully',
      data: categories,
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get transaction category by ID',
    description: 'Get transaction category information by ID',
  })
  @ApiParam({ name: 'id', description: 'Transaction Category ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async findOne(@Param('id', ParseUuidPipe) id: string) {
    const category = await this.transactionCategoriesService.findById(id);
    return {
      statusCode: 200,
      message: 'Transaction category retrieved successfully',
      data: category,
    };
  }

  @Patch(':id')
  @Roles('ADMIN', 'ACCOUNTANT')
  @ApiOperation({
    summary: 'Update transaction category',
    description: 'Update transaction category information',
  })
  @ApiParam({ name: 'id', description: 'Transaction Category ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async update(
    @Param('id', ParseUuidPipe) id: string,
    @Body() updateTransactionCategoryDto: UpdateTransactionCategoryDto,
  ) {
    const category = await this.transactionCategoriesService.update(id, updateTransactionCategoryDto);
    return {
      statusCode: 200,
      message: 'Transaction category updated successfully',
      data: category,
    };
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Soft delete transaction category',
    description: 'Soft delete transaction category',
  })
  @ApiParam({ name: 'id', description: 'Transaction Category ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async remove(@Param('id', ParseUuidPipe) id: string) {
    const category = await this.transactionCategoriesService.softDelete(id);
    return {
      statusCode: 200,
      message: 'Transaction category deleted successfully',
      data: category,
    };
  }

  @Patch(':id/restore')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Restore deleted transaction category',
    description: 'Restore a soft deleted transaction category',
  })
  @ApiParam({ name: 'id', description: 'Transaction Category ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async restore(@Param('id', ParseUuidPipe) id: string) {
    const category = await this.transactionCategoriesService.restore(id);
    return {
      statusCode: 200,
      message: 'Transaction category restored successfully',
      data: category,
    };
  }
}
