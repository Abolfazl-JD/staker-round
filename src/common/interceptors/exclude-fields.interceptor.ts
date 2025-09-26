import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';

@Injectable()
export class ExcludeFieldsInterceptor<T extends object>
  implements NestInterceptor<T, any>
{
  constructor(private exclude: (keyof T)[] = []) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const isAdmin = request.user?.role === 'admin';

    const removeFields = (item: T) => {
      const copy = { ...item };
      this.exclude.forEach((field) => delete copy[field]);
      return copy;
    };

    return next.handle().pipe(
      map((data) => {
        if (isAdmin) return data;

        if (Array.isArray(data)) {
          return data.map(removeFields);
        } else {
          return removeFields(data);
        }
      }),
    );
  }
}
