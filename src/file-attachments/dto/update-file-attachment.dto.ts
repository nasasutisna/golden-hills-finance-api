import { PartialType } from '@nestjs/swagger';
import { CreateFileAttachmentDto } from './create-file-attachment.dto';

export class UpdateFileAttachmentDto extends PartialType(CreateFileAttachmentDto) {}
