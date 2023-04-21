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
import { RolesType } from './role.type';

@Injectable()
export class RoleAccessCheckGuard implements CanActivate {
  constructor(private readonly whiteListRoles: RolesType[]) {}
  private logger = new Logger(RoleAccessCheckGuard.name);
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const role = user.role;
    this.logger.log('RoleAccessCheckGuard', { role, whiteListRoles: this.whiteListRoles });

    if (!this.whiteListRoles.includes(role)) {
      return true;
    } else {
      throw new ForbiddenException(`You dont have required access`);
    }
  }
}

export function RoleAccessCheck(whiteListRoles: RolesType[]) {
  return new RoleAccessCheckGuard(whiteListRoles);
}
