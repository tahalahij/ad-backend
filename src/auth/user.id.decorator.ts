import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import mongoose from 'mongoose';

export const UserId = createParamDecorator(async (data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user.id;
});
