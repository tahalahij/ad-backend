import { forwardRef, Inject, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { UserJwtPayload } from './user.jwt.type';
import { isDefined } from 'class-validator';
import { handleIPV6, persianStringJoin } from 'src/utils/helper';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { UserDocument } from '../user/user.schema';

@Injectable()
export class AuthService {
  private logger = new Logger(AuthService.name);
  constructor(
    private userService: UserService,
    @Inject(forwardRef(() => AuditLogsService)) private auditLogsService: AuditLogsService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<UserJwtPayload> {
    return this.userService.validateUser({ username, password });
  }
  async login(payload: UserJwtPayload, ip: string) {
    const operator = <UserDocument>await this.userService.getOperator(String(payload.id));
    this.logger.log('trying to log in ', { operator, ip });
    if (operator?.ip !== '' && isDefined(operator?.ip) && operator.ip !== handleIPV6(ip)) {
      // if only operator has ip
      throw new UnauthorizedException(`ایپی شما ${ip} است .شما فقط از ایپی ${operator.ip} میتوانید وارد شوید`);
    }
    this.auditLogsService.log({
      role: operator.role,
      initiatorId: operator._id,
      initiatorName: operator.name,
      description: persianStringJoin(['ورود ادمین ', operator.name, 'با دسترسی ', operator.role]),
    });

    return {
      access_token: this.jwtService.sign(payload),
      role: payload.role,
      name: operator.name,
    };
  }
}
