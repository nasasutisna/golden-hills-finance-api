import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { BackupService } from './backup.service';

/**
 * Backup & Restore — admin only.
 *
 * All routes under `/api/v1/backup` (global prefix applied in main.ts).
 */
@ApiTags('Backup')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('backup')
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'List stored backup files (Admin only)' })
  async list() {
    const data = await this.backupService.listBackups();
    return {
      statusCode: 200,
      message: 'Backups retrieved successfully',
      data,
    };
  }

  @Post()
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Create a backup archive (Admin only)',
    description:
      'Runs `mysqldump` and bundles the gzipped SQL (+ the uploads folder by default) into a single .zip stored in backups/. Set includeUploads=false for a DB-only archive.',
  })
  @ApiQuery({
    name: 'includeUploads',
    required: false,
    type: Boolean,
    description: 'Include the uploads/ folder in the archive (default true).',
  })
  async create(
    @Query('includeUploads') includeUploads?: string,
    @CurrentUser('id') _userId?: string,
  ) {
    const include = includeUploads === undefined ? true : includeUploads !== 'false';
    const data = await this.backupService.createBackup({ includeUploads: include });
    return {
      statusCode: 201,
      message: `Backup created${data.uploadsIncluded ? ' (DB + uploads)' : ' (DB only)'}`,
      data,
    };
  }

  @Get(':filename/download')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Download a backup file (Admin only)' })
  async download(@Param('filename') filename: string, @Res() res: Response) {
    await this.backupService.download(filename, res);
  }

  @Post('restore')
  @Roles('ADMIN')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Restore database (+ uploads) from a backup file (Admin only)',
    description:
      'Accepts a .zip produced by POST /backup, or a standalone .sql / .sql.gz. A pre-restore snapshot is created automatically. DESTRUCTIVE — overwrites the current database and uploads.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
      required: ['file'],
    },
  })
  async restore(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') _userId?: string,
  ) {
    if (!file) {
      throw new BadRequestException('Backup file is required (multipart field "file")');
    }
    const data = await this.backupService.restore(file);
    return {
      statusCode: 200,
      message: 'Restore completed successfully',
      data,
    };
  }

  @Delete(':filename')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete a stored backup file (Admin only)' })
  async remove(@Param('filename') filename: string) {
    await this.backupService.deleteBackup(filename);
    return {
      statusCode: 200,
      message: 'Backup deleted successfully',
      data: { filename },
    };
  }
}
