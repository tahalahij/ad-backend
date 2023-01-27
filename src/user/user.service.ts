import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserLoginDto } from './dtos/user.login.dto';
import mongoose, { Model } from 'mongoose';
import { User } from './user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { CryptoService } from './crypto.service';
import { CONSTANTS } from './constants/constants';

@Injectable()
export class UserService {
  constructor(private CryptoService: CryptoService, @InjectModel(User.name) private userModel: Model<User>) {}

  public async validateUser({ username, password }: UserLoginDto) {
    const user = await this.userModel.findOne({ username });
    if (!user) {
      throw new UnauthorizedException(CONSTANTS.LOGIN_FAILED);
    }
    const valid = this.CryptoService.hashValidation(password, user.password);
    if (!valid) {
      throw new UnauthorizedException(CONSTANTS.LOGIN_FAILED);
    }
    return {
      // the data that will be stored in JWT
      id: user._id,
      name: user.name,
    };
  }
  async seed(): Promise<User[]> {
    return this.userModel.insertMany([
      {
        _id: new mongoose.Types.ObjectId('63cd1f5e9c9abe5feca3fad6'),
        name: 'user 1',
        username: 'user1@gmail.com',
        password: await this.CryptoService.hashPassword('123'),
        createdAt: new Date(),
      },
      {
        _id: new mongoose.Types.ObjectId('63cd1f12cef39cbd9234a20c'),
        name: 'user 2',
        email: 'user2@gmail.com',
        password: await this.CryptoService.hashPassword('123'),
        createdAt: new Date(),
      },
    ]);
  }
}
