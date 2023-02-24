import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { UserJwtPayload } from './user.jwt.type';

@Injectable()
export class AuthService {
  constructor(private userService: UserService, private jwtService: JwtService) {}

  async validateUser(username: string, password: string): Promise<UserJwtPayload> {
    return this.userService.validateUser({ username, password });
  }
  async login(payload: UserJwtPayload) {
    return {
      access_token: this.jwtService.sign(payload),
      role: payload.role,
    };
  }
}
