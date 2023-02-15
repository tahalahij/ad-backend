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
    console.log('$$$$', request.ip, ip);
    return true;

    if (request.ip == ip) {
      return true;
    } else {
      throw new ForbiddenException(`You dont have accessed from this ip, you ip : ${request.ip}`);
    }
  }
}

export function AccessCheck() {
  return applyDecorators(UseGuards(AccessCheckGuard));
}
