import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { mergeMap, Observable } from 'rxjs';

@Injectable()
export class StripperPasswordFromUserInterceptor implements NestInterceptor {
  removeKeys(user) {
    user.password = '****';
    console.log({ user });
    return user;
  }

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    return next.handle().pipe(
      mergeMap(async (res) => {
        if (Array.isArray(res?.data)) {
          res.data = res?.data.map((m) => this.removeKeys(m));
        } else {
          res = this.removeKeys(res);
        }
        return res;
      }),
    );
  }
}
