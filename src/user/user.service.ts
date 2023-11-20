import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserLoginDto } from './dtos/user.login.dto';
import { FilterQuery, Model } from 'mongoose';
import { User } from './user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { CryptoService } from './crypto.service';
import { CONSTANTS } from './constants/constants';
import { UserJwtPayload } from '../auth/user.jwt.type';
import { RolesType } from '../auth/role.type';
import { UpdateUserDto } from './dtos/update.user.dto';
import { CreateUserDto } from './dtos/create.user.dto';
import { ConfigService } from '@nestjs/config';
import paginate, { PaginationRes } from '../utils/pagination.util';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { likeRegx, persianStringJoin } from '../utils/helper';
import { GetUsersQueryDto } from './dtos/get.users.query.dto';
import { filter } from 'rxjs';

@Injectable()
export class UserService {
  private logger = new Logger(UserService.name);
  constructor(
    private CryptoService: CryptoService,
    @InjectModel(User.name) private userModel: Model<User>,
    @Inject(forwardRef(() => AuditLogsService)) private auditLogsService: AuditLogsService,
    private readonly configService: ConfigService,
  ) {}

  public async getOperators({ mac, name, ip, username, ...rest }: GetUsersQueryDto): Promise<PaginationRes> {
    const filter: FilterQuery<User> = { role: RolesType.OPERATOR };
    if (username) {
      filter.username = likeRegx(username);
    }

    if (name) {
      filter.name = likeRegx(name);
    }

    if (mac) {
      filter.mac = likeRegx(mac);
    }

    if (ip) {
      filter.ip = likeRegx(ip);
    }
    return paginate(this.userModel, filter, rest);
  }

  public async getOperator(id: string): Promise<User> {
    const user = await this.userModel.findById(id).lean();
    if (!user) {
      throw new NotFoundException('اپراتور پیدا نشد');
    }
    return user;
  }

  public async getControllers({ mac, name, ip, username, ...rest }: GetUsersQueryDto): Promise<PaginationRes> {
    const filter: FilterQuery<User> = { role: RolesType.CONTROLLER };
    if (username) {
      filter.username = likeRegx(username);
    }

    if (name) {
      filter.name = likeRegx(name);
    }

    if (mac) {
      filter.mac = likeRegx(mac);
    }

    if (ip) {
      filter.ip = likeRegx(ip);
    }
    return paginate(this.userModel, filter, rest);
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
      id: String(user._id),
      name: user.name,
    };
  }
  async createNewUser(initiator: UserJwtPayload, body: CreateUserDto): Promise<User> {
    const user = await this.userModel.create({
      ...body,
      password: await this.CryptoService.hashPassword(body.password),
      createdAt: new Date(),
    });
    this.auditLogsService.log({
      role: initiator.role,
      initiatorId: initiator.id,
      initiatorName: initiator.name,
      description: persianStringJoin([' کاربر جدید', user.name, ' را ایجاد کرد ']),
    });

    return user;
  }

  async updateUser(initiator: UserJwtPayload, id: string, updateObj: UpdateUserDto): Promise<User> {
    const user = await this.userModel.findById(id);
    if (updateObj.username) {
      const exists = await this.userModel.exists({ username: updateObj.username, _id: { $ne: id } });
      if (exists) {
        throw new BadRequestException('اپراتور با این نام کاربری وجود دارد');
      }
    }
    this.auditLogsService.log({
      role: initiator.role,
      initiatorId: initiator.id,
      initiatorName: initiator.name,
      description: persianStringJoin(['اپدیت کاربر', user.name, 'تغییرات : ', ...Object.keys(updateObj)]),
    });
    if (updateObj.password) {
      updateObj.password = await this.CryptoService.hashPassword(updateObj.password);
    }
    user.set(updateObj);
    await user.save();
    return user.toObject();
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
