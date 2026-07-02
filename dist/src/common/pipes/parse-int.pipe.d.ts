import { PipeTransform, ArgumentMetadata } from '@nestjs/common';
export declare class ParseIntPipe implements PipeTransform<string, number> {
    transform(value: string, metadata: ArgumentMetadata): number;
}
export declare class OptionalParseIntPipe implements PipeTransform {
    transform(value: string, metadata: ArgumentMetadata): number | undefined;
}
