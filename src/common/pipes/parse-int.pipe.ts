import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class ParseIntPipe implements PipeTransform<string, number> {
  transform(value: string, metadata: ArgumentMetadata): number {
    if (!value) {
      throw new BadRequestException(`Validation failed: ${metadata.data} is required`);
    }

    const num = parseInt(value, 10);

    if (isNaN(num)) {
      throw new BadRequestException(
        `Validation failed: ${metadata.data} must be a valid integer`,
      );
    }

    return num;
  }
}

export class OptionalParseIntPipe implements PipeTransform {
  transform(value: string, metadata: ArgumentMetadata): number | undefined {
    if (!value) {
      return undefined;
    }

    const num = parseInt(value, 10);

    if (isNaN(num)) {
      throw new BadRequestException(
        `Validation failed: ${metadata.data} must be a valid integer`,
      );
    }

    return num;
  }
}
