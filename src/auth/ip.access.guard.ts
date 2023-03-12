import {
  applyDecorators,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  UseGuards,
} from '@nestjs/common';
import { parse } from 'path';

@Injectable()
export class IpAccessCheckGuard implements CanActivate {
  private logger = new Logger(IpAccessCheckGuard.name);
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const { fileName } = request.params;

    const filename: string = parse(fileName).name;

    const ip = filename.substring(filename.lastIndexOf('-') + 1, filename.length);
    this.logger.log(fileName),
      {
        requestIp: request.ip,
        ip,
      };
    return true;

    if (request.ip == ip) {
      return true;
    } else {
      throw new ForbiddenException(`You dont have accessed from this ip, you ip : ${request.ip}`);
    }
  }
}

export function IpAccessCheck() {
  return applyDecorators(UseGuards(IpAccessCheckGuard));
}
