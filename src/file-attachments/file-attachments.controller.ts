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
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileAttachmentsService } from './file-attachments.service';
import { CreateFileAttachmentDto } from './dto/create-file-attachment.dto';
import { UpdateFileAttachmentDto } from './dto/update-file-attachment.dto';
import { QueryFileAttachmentsDto } from './dto/query-file-attachments.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@ApiTags('File Attachments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('file-attachments')
export class FileAttachmentsController {
  constructor(private readonly fileAttachmentsService: FileAttachmentsService) {}

  @Post('upload')
  @Roles('ADMIN', 'MANAGER', 'STAFF', 'PENGURUS', 'COORDINATOR')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile() {
    return {
      statusCode: 200,
      message: 'Controller reached',
      data: {},
    };
  }

  @Post('upload/multiple')
  @Roles('ADMIN', 'MANAGER', 'STAFF', 'PENGURUS', 'COORDINATOR')
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload multiple files' })
  @ApiResponse({ status: 201, description: 'Files uploaded successfully' })
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser('id') userId: string,
    @Body('entityType') entityType: string,
    @Body('entityId') entityId: string,
    @Body('category') category?: string,
    @Body('description') description?: string,
  ) {
    const uploadPromises = files.map(file => {
      const createFileAttachmentDto: CreateFileAttachmentDto = {
        entityType,
        entityId,
        fileName: file.originalname,
        filePath: `/uploads/${file.filename}`,
        fileSize: file.size,
        mimeType: file.mimetype,
        category,
        description,
      };

      return this.fileAttachmentsService.create(createFileAttachmentDto, userId);
    });

    return Promise.all(uploadPromises);
  }

  @Get()
  @ApiOperation({ summary: 'Get all file attachments with pagination' })
  @ApiResponse({ status: 200, description: 'File attachments retrieved successfully' })
  findAll(@Query() queryDto: QueryFileAttachmentsDto) {
    return this.fileAttachmentsService.findAll(queryDto);
  }

  @Get('stats')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Get file statistics' })
  @ApiResponse({ status: 200, description: 'File statistics retrieved successfully' })
  getFileStats() {
    return this.fileAttachmentsService.getFileStats();
  }

  @Get('entity/:entityType/:entityId')
  @ApiOperation({ summary: 'Get all files for an entity' })
  @ApiResponse({ status: 200, description: 'Files retrieved successfully' })
  findByEntity(@Param('entityType') entityType: string, @Param('entityId') entityId: string) {
    return this.fileAttachmentsService.findByEntity(entityType, entityId);
  }

  @Get('category/:category')
  @ApiOperation({ summary: 'Get all files by category' })
  @ApiResponse({ status: 200, description: 'Files retrieved successfully' })
  findByCategory(@Param('category') category: string) {
    return this.fileAttachmentsService.findByCategory(category);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get file attachment by ID' })
  @ApiResponse({ status: 200, description: 'File attachment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'File attachment not found' })
  findById(@Param('id') id: string) {
    return this.fileAttachmentsService.findById(id);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download file' })
  @ApiResponse({ status: 200, description: 'File downloaded successfully' })
  @ApiResponse({ status: 404, description: 'File attachment not found' })
  async downloadFile(@Param('id') id: string, @Res() res: Response) {
    const attachment = await this.fileAttachmentsService.findById(id);
    const filePath = path.join(process.cwd(), attachment.filePath);

    if (!fs.existsSync(filePath)) {
      res.status(404).send('File not found');
      return;
    }

    const file = fs.createReadStream(filePath);
    res.header({
      'Content-Disposition': `attachment; filename="${attachment.fileName}"`,
      'Content-Type': attachment.mimeType,
    });

    file.pipe(res);
  }

  @Get(':id/view')
  @ApiOperation({ summary: 'View file in browser' })
  @ApiResponse({ status: 200, description: 'File displayed successfully' })
  @ApiResponse({ status: 404, description: 'File attachment not found' })
  async viewFile(@Param('id') id: string, @Res() res: Response) {
    const attachment = await this.fileAttachmentsService.findById(id);
    const filePath = path.join(process.cwd(), attachment.filePath);

    if (!fs.existsSync(filePath)) {
      res.status(404).send('File not found');
      return;
    }

    const file = fs.createReadStream(filePath);
    res.header({
      'Content-Type': attachment.mimeType,
    });

    file.pipe(res);
  }

  @Patch(':id')
  @Roles('ADMIN', 'MANAGER', 'STAFF')
  @ApiOperation({ summary: 'Update file attachment metadata' })
  @ApiResponse({ status: 200, description: 'File attachment updated successfully' })
  @ApiResponse({ status: 404, description: 'File attachment not found' })
  update(@Param('id') id: string, @Body() updateFileAttachmentDto: UpdateFileAttachmentDto) {
    return this.fileAttachmentsService.update(id, updateFileAttachmentDto);
  }

  @Delete(':id')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Delete file attachment' })
  @ApiResponse({ status: 200, description: 'File attachment deleted successfully' })
  @ApiResponse({ status: 404, description: 'File attachment not found' })
  remove(@Param('id') id: string) {
    return this.fileAttachmentsService.remove(id);
  }
}
