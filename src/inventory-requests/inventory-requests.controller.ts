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
import { InventoryRequestsService } from './inventory-requests.service';
import { CreateInventoryRequestDto } from './dto/create-inventory-request.dto';
import { UpdateInventoryRequestDto } from './dto/update-inventory-request.dto';
import { QueryInventoryRequestsDto } from './dto/query-inventory-requests.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Inventory Requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory-requests')
export class InventoryRequestsController {
  constructor(private readonly inventoryRequestsService: InventoryRequestsService) {}

  @Post()
  @Roles('ADMIN', 'MANAGER', 'STAFF')
  @ApiOperation({ summary: 'Create a new inventory request' })
  @ApiResponse({ status: 201, description: 'Inventory request created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'Request number already exists' })
  create(@Body() createInventoryRequestDto: CreateInventoryRequestDto, @CurrentUser('id') userId: string) {
    return this.inventoryRequestsService.create(createInventoryRequestDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all inventory requests with pagination' })
  @ApiResponse({ status: 200, description: 'Inventory requests retrieved successfully' })
  findAll(@Query() queryDto: QueryInventoryRequestsDto) {
    return this.inventoryRequestsService.findAll(queryDto);
  }

  @Get('status/:status')
  @ApiOperation({ summary: 'Get requests by status' })
  @ApiResponse({ status: 200, description: 'Requests retrieved successfully' })
  findByStatus(@Param('status') status: string) {
    return this.inventoryRequestsService.findByStatus(status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get inventory request by ID' })
  @ApiResponse({ status: 200, description: 'Inventory request retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Inventory request not found' })
  findById(@Param('id') id: string) {
    return this.inventoryRequestsService.findById(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Update inventory request' })
  @ApiResponse({ status: 200, description: 'Inventory request updated successfully' })
  @ApiResponse({ status: 404, description: 'Inventory request not found' })
  update(@Param('id') id: string, @Body() updateInventoryRequestDto: UpdateInventoryRequestDto) {
    return this.inventoryRequestsService.update(id, updateInventoryRequestDto);
  }

  @Patch(':id/approve')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Approve inventory request' })
  @ApiResponse({ status: 200, description: 'Inventory request approved successfully' })
  @ApiResponse({ status: 404, description: 'Inventory request not found' })
  @ApiResponse({ status: 409, description: 'Cannot approve request with current status' })
  approveRequest(
    @Param('id') id: string,
    @CurrentUser('id') approverId: string,
    @Body('notes') notes?: string,
  ) {
    return this.inventoryRequestsService.approveRequest(id, approverId, notes);
  }

  @Patch(':id/reject')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Reject inventory request' })
  @ApiResponse({ status: 200, description: 'Inventory request rejected successfully' })
  @ApiResponse({ status: 404, description: 'Inventory request not found' })
  @ApiResponse({ status: 409, description: 'Cannot reject request with current status' })
  rejectRequest(
    @Param('id') id: string,
    @CurrentUser('id') approverId: string,
    @Body('notes') notes?: string,
  ) {
    return this.inventoryRequestsService.rejectRequest(id, approverId, notes);
  }

  @Patch(':id/complete')
  @Roles('ADMIN', 'MANAGER', 'STAFF')
  @ApiOperation({ summary: 'Complete inventory request and update stock' })
  @ApiResponse({ status: 200, description: 'Inventory request completed successfully' })
  @ApiResponse({ status: 404, description: 'Inventory request not found' })
  @ApiResponse({ status: 409, description: 'Cannot complete request with current status' })
  completeRequest(@Param('id') id: string) {
    return this.inventoryRequestsService.completeRequest(id);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete inventory request' })
  @ApiResponse({ status: 200, description: 'Inventory request deleted successfully' })
  @ApiResponse({ status: 404, description: 'Inventory request not found' })
  remove(@Param('id') id: string) {
    return this.inventoryRequestsService.remove(id);
  }
}
