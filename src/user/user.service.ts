import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { UserLoginDto } from './dtos/user.login.dto';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { CryptoService } from './crypto.service';
import { CONSTANTS } from './constants/constants';
import { UserJwtPayload } from '../auth/user.jwt.type';
import { RolesType } from '../auth/role.type';
import { UpdateUserDto } from './dtos/update.user.dto';

@Injectable()
export class UserService {
  constructor(private CryptoService: CryptoService, @InjectModel(User.name) private userModel: Model<User>) {}

  public async getOperator(): Promise<UserDocument[]> {
    return this.userModel.find({ role: RolesType.OPERATOR });
  }
  public async validateUser({ username, password }: UserLoginDto): Promise<UserJwtPayload> {
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
      role: user.role,
      id: user._id,
      name: user.name,
    };
  }
  async createNewUser({
    name,
    username,
    password,
    ip,
    role,
  }: {
    name: string;
    username: string;
    password: string;
    ip: string;
    role: RolesType;
  }): Promise<User> {
    return this.userModel.create({
      name,
      ip,
      role,
      username,
      password: await this.CryptoService.hashPassword(password),
      createdAt: new Date(),
    });
  }

  async updateUser(id: string, updateObj: UpdateUserDto): Promise<User> {
    if (updateObj.username) {
      const exists = await this.userModel.exists({ _id: id });
      if (exists) {
        throw new BadRequestException('Operator with this username already exists');
      }
    }
    return this.userModel.findByIdAndUpdate(id, updateObj);
  }

  async seed() {
    await this.createNewUser({
      name: 'Admin',
      username: 'Admin',
      role: RolesType.ADMIN,
      ip: '1.1.1.1',
      password: 'khorram',
    });
    await this.createNewUser({
      name: 'operator of x',
      username: 'operator',
      role: RolesType.OPERATOR,
      ip: '1.1.1.1',
      password: 'operator',
    });
  }
  async findByIp(ip: string) {
    const user = await this.userModel.findOne({ ip });
    if (!user) {
      throw new NotFoundException(`Ip ${ip} not recognized `);
    }
    return user;
  }
}
