import { BadRequestException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { FilterQuery, Model } from 'mongoose';
import { Device, DeviceDocument } from './device.schema';
import { InjectModel } from '@nestjs/mongoose';
import { CreateDeviceDto } from './dtos/create.device.dto';
import { UpdateDeviceDto } from './dtos/update.device.dto';
import { ScheduleService } from '../schedule/schedule.service';
import { Schedule } from '../schedule/schedule.schema';
import { File } from '../file/file.schema';
import { GetDevicesQueryDto } from './dtos/get.devices.query.dto';
import { UserService } from '../user/user.service';
import paginate, { PaginationRes } from '../utils/pagination.util';
import { User, UserDocument } from '../user/user.schema';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { likeRegx, persianStringJoin } from '../utils/helper';
import { UserJwtPayload } from '../auth/user.jwt.type';
import { RolesType } from '../auth/role.type';

@Injectable()
export class DeviceService {
  constructor(
    @InjectModel(Device.name) private deviceModel: Model<Device>,

    @Inject(forwardRef(() => UserService)) private userService: UserService,
    @Inject(forwardRef(() => ScheduleService)) private scheduleService: ScheduleService,
    @Inject(forwardRef(() => AuditLogsService)) private auditLogsService: AuditLogsService,
  ) {}

  async createNewDevice(data: CreateDeviceDto): Promise<Device> {
    const operator = <UserDocument>await this.userService.getOperator(data.operatorId);

    const exists = await this.deviceModel.findOne({ ip: data.ip });
    if (exists) {
      throw new BadRequestException('دستگاه با این ایپی وجود دارد');
    }

    this.auditLogsService.log({
      role: operator.role,
      initiatorId: operator._id,
      initiatorName: operator.name,
      description: persianStringJoin([' ایجاد دستگاه ', data.name]),
    });
    return this.deviceModel.create({
      ...data,
      createdAt: new Date(),
      enabled: true,
    });
  }

  async updateDevice(initiator: UserJwtPayload, id: string, updateObj: UpdateDeviceDto): Promise<Device> {
    const device = await this.deviceModel.findById(id);
    if (updateObj.ip) {
      const countSimilarIP = await this.deviceModel.count({ ip: updateObj.ip });
      if (countSimilarIP > 1) {
        throw new BadRequestException('دستگاه با این ایپی وجود دارد');
      }
    }
    this.auditLogsService.log({
      role: initiator.role,
      initiatorId: initiator.id,
      initiatorName: initiator.name,
      description: persianStringJoin([' اپدیت دستگاه ', device.name]),
    });
    return this.deviceModel.findByIdAndUpdate(id, updateObj);
  }

  async getDevices({ name, operatorId, ip, mac, ...rest }: GetDevicesQueryDto): Promise<PaginationRes> {
    const filter: FilterQuery<Device> = {};
    if (operatorId) {
      filter.operatorId = operatorId;
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
    return paginate(this.deviceModel, filter, {
      populates: ['operatorId'],
      ...rest,
    });
  }

  async getDevice(filter: FilterQuery<Device> = {}): Promise<DeviceDocument> {
    const device = await this.deviceModel.findOne(filter);
    if (!device) {
      throw new NotFoundException(`دستگاه پیدا نشد`);
    }
    return device;
  }
  async getDeviceEnabled(ip: string): Promise<{ enabled: boolean }> {
    const device = await this.deviceModel.findOne({ ip });
    if (!device) {
      throw new NotFoundException(`دستگاه پیدا نشد`);
    }
    return { enabled: device.enabled };
  }

  async getDevicesCurrentSchedule(deviceId: string): Promise<{ schedule: Schedule; file: File; device: Device }> {
    const device = await this.getDevice({ _id: deviceId });
    return {
      device,
      ...(await this.scheduleService.getSchedule(device.ip)),
    };
  }
  async checkDeviceIpMatchesOperator(ip: string, operatorId: string): Promise<boolean> {
    const exists = await this.deviceModel.exists({ ip, operatorId, enabled: true });
    return Boolean(exists);
  }
}
