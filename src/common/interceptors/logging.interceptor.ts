import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
        const req = ctx.switchToHttp().getRequest<Request>() as any;
        const start = Date.now();
        return next.handle().pipe(tap(() => console.log(`${req.method} ${req.url} ${Date.now() - start}ms`)));
    }
}