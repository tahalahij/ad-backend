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
import { CreateUserDto } from './dtos/create.user.dto';

@Injectable()
export class UserService {
  constructor(private CryptoService: CryptoService, @InjectModel(User.name) private userModel: Model<User>) {}

  public async getOperators(): Promise<UserDocument[]> {
    return this.userModel.find({ role: RolesType.OPERATOR });
  }
  public async getOperatorById(id: string): Promise<UserDocument> {
    return this.userModel.findById(id);
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
  async createNewUser(body: CreateUserDto): Promise<User> {
    return this.userModel.create({
      ...body,
      role: RolesType.OPERATOR,
      password: await this.CryptoService.hashPassword(body.password),
      createdAt: new Date(),
    });
  }

  async updateUser(id: string, updateObj: UpdateUserDto): Promise<User> {
    if (updateObj.username) {
      const exists = await this.userModel.exists({ username: updateObj.username });
      if (!exists) {
        throw new BadRequestException('Operator with this username already exists');
      }
    }
    if (updateObj.password) {
      updateObj.password = await this.CryptoService.hashPassword(updateObj.password);
    }
    return this.userModel.findByIdAndUpdate(id, updateObj);
  }

  async seed() {
    await this.userModel.create({
      createdAt: new Date(),
      name: 'Admin',
      username: 'Admin',
      role: RolesType.ADMIN,
      ip: '1.1.1.1',
      mac: '1.1.1.1',
      password: await this.CryptoService.hashPassword('khorram'),
    });
    await this.userModel.create({
      createdAt: new Date(),
      name: 'operator of x',
      username: 'operator',
      role: RolesType.OPERATOR,
      ip: '1.1.1.1',
      mac: '1.1.1.1',
      password: await this.CryptoService.hashPassword('operator'),
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
