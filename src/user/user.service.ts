import { BadRequestException, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
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
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UserService {
  private logger = new Logger(UserService.name);
  constructor(
    private CryptoService: CryptoService,
    @InjectModel(User.name) private userModel: Model<User>,
    private readonly configService: ConfigService,
  ) {}

  public async getOperators(): Promise<UserDocument[]> {
    return this.userModel.find({ role: RolesType.OPERATOR }).lean();
  }

  public async getControllers(): Promise<UserDocument[]> {
    return this.userModel.find({ role: RolesType.CONTROLLER }).lean();
  }
  public async getOperatorById(id: string): Promise<UserDocument> {
    return this.userModel.findById(id);
  }
  public async validateUser({ username, password }: UserLoginDto): Promise<UserJwtPayload> {
    const user = await this.userModel.findOne({ username });
    if (!user) {
      throw new UnauthorizedException(CONSTANTS.LOGIN_FAILED);
    }
    const valid = await this.CryptoService.hashValidation(password, user.password);
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
      password: await this.CryptoService.hashPassword(body.password),
      createdAt: new Date(),
    });
  }

  async updateUser(id: string, updateObj: UpdateUserDto): Promise<User> {
    const user = await this.userModel.findById(id);
    if (updateObj.username) {
      const exists = await this.userModel.exists({ username: updateObj.username, id: { $ne: id } });
      if (!exists) {
        throw new BadRequestException('اپراتور با این نام کاربری وجود دارد');
      }
    }
    if (updateObj.password) {
      updateObj.password = await this.CryptoService.hashPassword(updateObj.password);
    }
    user.set({
      ip: updateObj.ip,
      mac: updateObj.mac,
      name: updateObj.name,
    });
    return user.save();
  }

  async seedAdmin() {
    const admin = await this.userModel.create({
      createdAt: new Date(),
      name: 'Admin',
      username: 'Admin',
      role: RolesType.ADMIN,
      ip: this.configService.get('ADMIN_IP'),
      mac: this.configService.get('ADMIN_MAC'),
      password: await this.CryptoService.hashPassword('khorram'),
    });

    const controller = await this.userModel.create({
      createdAt: new Date(),
      name: 'Controller',
      username: 'control',
      role: RolesType.CONTROLLER,
      ip: this.configService.get('ADMIN_IP'),
      mac: this.configService.get('ADMIN_MAC'),
      password: await this.CryptoService.hashPassword('khorram'),
    });
    this.logger.log('seedAdmin successful', { admin, controller });
  }
}
