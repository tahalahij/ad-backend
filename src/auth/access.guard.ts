import {
  applyDecorators,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UseGuards,
} from '@nestjs/common';
import { parse } from 'path';

@Injectable()
export class AccessCheckGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const { fileName } = request.params;
    console.log(fileName);

    const filename: string = parse(fileName).name;

    const ip = filename.substring(filename.lastIndexOf('-') + 1, filename.length);
    console.log(ip);

    if (request.ip == ip) {
      return true;
    } else {
      throw new ForbiddenException('Cant be accessed from this ip');
    }
  }
}

export function AccessCheck() {
  return applyDecorators(UseGuards(AccessCheckGuard));
}
