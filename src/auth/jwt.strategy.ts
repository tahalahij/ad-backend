import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, Logger } from '@nestjs/common';
import { RolesType } from './role.type';
import { UserService } from '../user/user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private logger = new Logger(JwtStrategy.name);
  constructor(private readonly userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.PASSPORT_JWT_SECRET,
    });
  }

  async validate(user: any) {
    this.logger.log('Jwt strategy validate()', { user });
    if (user.role !== RolesType.ADMIN) {
      await this.userService.checkIsEnabled(user.id);
    }
    return user;
  }
}
