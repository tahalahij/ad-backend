import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { UserJwtPayload } from './user.jwt.type';

@Injectable()
export class AuthService {
  private logger = new Logger(AuthService.name);
  constructor(private userService: UserService, private jwtService: JwtService) {}

  async validateUser(username: string, password: string): Promise<UserJwtPayload> {
    return this.userService.validateUser({ username, password });
  }
  async login(payload: UserJwtPayload, ip: string) {
    const operator = await this.userService.getOperatorById(String(payload.id));
    this.logger.log('trying to log in ', { operator, ip });
    if (operator.ip !== ip) {
      throw new UnauthorizedException(`Your ip is ${ip}, but you can only login with ${operator.ip}`);
    }
    return {
      access_token: this.jwtService.sign(payload),
      role: payload.role,
    };
  }
}
