import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserJwtPayload } from './user.jwt.type';

export const ReqUser = createParamDecorator(async (data: unknown, ctx: ExecutionContext): Promise<UserJwtPayload> => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});
