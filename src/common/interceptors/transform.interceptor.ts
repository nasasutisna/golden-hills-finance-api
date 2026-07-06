import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ResponseDto } from '../dto/response.dto';

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ResponseDto<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ResponseDto<T>> {
    const request = context.switchToHttp().getRequest();

    return next.handle().pipe(
      map((data) => {
        // If the response is already a ResponseDto, return it as is
        if (data instanceof ResponseDto) {
          return data;
        }

        // Otherwise, wrap it in a ResponseDto
        const response = new ResponseDto(
          context.switchToHttp().getResponse().statusCode,
          data?.message || 'Success',
          data?.data !== undefined ? data.data : data,
          data?.errors,
        );

        // Preserve meta if it exists (for paginated responses)
        if (data?.meta) {
          (response as any).meta = data.meta;
        }

        response.path = request.url;
        return response;
      }),
    );
  }
}
