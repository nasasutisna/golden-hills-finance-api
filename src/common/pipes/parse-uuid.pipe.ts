import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { validate as isUUID } from 'uuid';

@Injectable()
export class ParseUuidPipe implements PipeTransform<string, string> {
  transform(value: string, metadata: ArgumentMetadata): string {
    if (!value) {
      throw new BadRequestException(`Validation failed: ${metadata.data} is required`);
    }

    if (!isUUID(value)) {
      throw new BadRequestException(
        `Validation failed: ${metadata.data} must be a valid UUID`,
      );
    }

    return value;
  }
}

export class OptionalParseUuidPipe implements PipeTransform {
  transform(value: string, metadata: ArgumentMetadata): string | undefined {
    if (!value) {
      return undefined;
    }

    if (!isUUID(value)) {
      throw new BadRequestException(
        `Validation failed: ${metadata.data} must be a valid UUID`,
      );
    }

    return value;
  }
}
