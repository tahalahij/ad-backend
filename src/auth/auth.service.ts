import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import mongoose from 'mongoose';

@Injectable()
export class AuthService {
  constructor(private userService: UserService, private jwtService: JwtService) {}

  async validateUser(username: string, password: string): Promise<any> {
    return this.userService.validateUser({ username, password });
  }
  async login(payload: { id: mongoose.Types.ObjectId; sub: mongoose.Types.ObjectId; name: string }) {
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
