import {
  Controller,
  Get,
  Post,
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
import { ApprovalHistoriesService } from './approval-histories.service';
import { CreateApprovalHistoryDto } from './dto/create-approval-history.dto';
import { QueryOptionsDto } from '../common/dto/query-options.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ParseUuidPipe } from '../common/pipes/parse-uuid.pipe';
import { ApiResponseDecorators } from '../common/decorators/http-response.decorator';

@ApiTags('Approval Histories')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('approval-histories')
export class ApprovalHistoriesController {
  constructor(private readonly approvalHistoriesService: ApprovalHistoriesService) {}

  @Post()
  @Roles('ADMIN', 'MANAGER', 'ACCOUNTANT')
  @ApiOperation({
    summary: 'Create approval history',
    description: 'Create an approval history record',
  })
  @ApiResponseDecorators.created()
  @ApiResponseDecorators.standard()
  async create(@Body() createApprovalHistoryDto: CreateApprovalHistoryDto) {
    const history = await this.approvalHistoriesService.create(createApprovalHistoryDto);
    return {
      statusCode: 201,
      message: 'Approval history created successfully',
      data: history,
    };
  }

  @Get()
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({
    summary: 'Get all approval histories',
    description: 'Get paginated list of approval histories',
  })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async findAll(@Query() queryOptions: QueryOptionsDto) {
    const result = await this.approvalHistoriesService.findAll(queryOptions);
    return {
      statusCode: 200,
      message: 'Approval histories retrieved successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get(':entityType/:entityId')
  @ApiOperation({
    summary: 'Get approval history by entity',
    description: 'Get approval history for a specific entity',
  })
  @ApiParam({ name: 'entityType', description: 'Entity type (e.g., CashTransaction)' })
  @ApiParam({ name: 'entityId', description: 'Entity ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async getByEntity(
    @Param('entityType') entityType: string,
    @Param('entityId', ParseUuidPipe) entityId: string,
  ) {
    const histories = await this.approvalHistoriesService.findByEntity(entityType, entityId);
    return {
      statusCode: 200,
      message: 'Approval histories retrieved successfully',
      data: histories,
    };
  }
}
