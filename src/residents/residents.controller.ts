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
import { ResidentsService } from './residents.service';
import { CreateResidentDto } from './dto/create-resident.dto';
import { UpdateResidentDto } from './dto/update-resident.dto';
import { QueryOptionsDto } from '../common/dto/query-options.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ParseUuidPipe } from '../common/pipes/parse-uuid.pipe';
import { ApiResponseDecorators } from '../common/decorators/http-response.decorator';

@ApiTags('Residents')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('residents')
export class ResidentsController {
  constructor(private readonly residentsService: ResidentsService) {}

  @Post()
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({
    summary: 'Create new resident',
    description: 'Create a new resident profile',
  })
  @ApiResponseDecorators.created()
  @ApiResponseDecorators.standard()
  async create(@Body() createResidentDto: CreateResidentDto) {
    const resident = await this.residentsService.create(createResidentDto);
    return {
      statusCode: 201,
      message: 'Resident created successfully',
      data: resident,
    };
  }

  @Get()
  @ApiOperation({
    summary: 'Get all residents',
    description: 'Get paginated list of residents',
  })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async findAll(@Query() queryOptions: QueryOptionsDto) {
    const result = await this.residentsService.findAll(queryOptions);
    return {
      statusCode: 200,
      message: 'Residents retrieved successfully',
      data: result.data,
      meta: result.meta,
    };
  }

  @Get('active/count')
  @ApiOperation({
    summary: 'Get active residents count',
    description: 'Get total number of active residents',
  })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async getActiveCount() {
    const count = await this.residentsService.getActiveResidentsCount();
    return {
      statusCode: 200,
      message: 'Active residents count retrieved successfully',
      data: { count },
    };
  }

  @Get('house-block/:houseBlockId')
  @ApiOperation({
    summary: 'Get residents by house block',
    description: 'Get all residents in a specific house block',
  })
  @ApiParam({ name: 'houseBlockId', description: 'House Block ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async getByHouseBlock(@Param('houseBlockId', ParseUuidPipe) houseBlockId: string) {
    const residents = await this.residentsService.getByHouseBlock(houseBlockId);
    return {
      statusCode: 200,
      message: 'Residents retrieved successfully',
      data: residents,
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get resident by ID',
    description: 'Get resident information by ID',
  })
  @ApiParam({ name: 'id', description: 'Resident ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async findOne(@Param('id', ParseUuidPipe) id: string) {
    const resident = await this.residentsService.findById(id);
    return {
      statusCode: 200,
      message: 'Resident retrieved successfully',
      data: resident,
    };
  }

  @Patch(':id')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({
    summary: 'Update resident',
    description: 'Update resident information',
  })
  @ApiParam({ name: 'id', description: 'Resident ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async update(
    @Param('id', ParseUuidPipe) id: string,
    @Body() updateResidentDto: UpdateResidentDto,
  ) {
    const resident = await this.residentsService.update(id, updateResidentDto);
    return {
      statusCode: 200,
      message: 'Resident updated successfully',
      data: resident,
    };
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Soft delete resident',
    description: 'Soft delete resident profile',
  })
  @ApiParam({ name: 'id', description: 'Resident ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async remove(@Param('id', ParseUuidPipe) id: string) {
    const resident = await this.residentsService.softDelete(id);
    return {
      statusCode: 200,
      message: 'Resident deleted successfully',
      data: resident,
    };
  }

  @Patch(':id/restore')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Restore deleted resident',
    description: 'Restore a soft deleted resident',
  })
  @ApiParam({ name: 'id', description: 'Resident ID' })
  @ApiResponseDecorators.ok()
  @ApiResponseDecorators.standard()
  async restore(@Param('id', ParseUuidPipe) id: string) {
    const resident = await this.residentsService.restore(id);
    return {
      statusCode: 200,
      message: 'Resident restored successfully',
      data: resident,
    };
  }
}
