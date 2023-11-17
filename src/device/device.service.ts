import { BadRequestException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
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
import { UserDocument } from '../user/user.schema';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { persianStringJoin } from '../utils/helper';
import { UserJwtPayload } from '../auth/user.jwt.type';

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

  async getDevices({ _sort, _order, limit, page, ...rest }: GetDevicesQueryDto): Promise<PaginationRes> {
    return paginate(this.deviceModel, rest, {
      populates: ['operatorId'],
      page,
      limit,
      _sort,
      _order,
    });
  }

  async getDevice(filter = {}): Promise<DeviceDocument> {
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

  async getDevicesCurrentSchedule(deviceId: string): Promise<{ schedule: Schedule; file: File }> {
    const device = await this.getDevice({ _id: deviceId });
    return this.scheduleService.getSchedule(device.ip);
  }
  async checkDeviceIpMatchesOperator(ip: string, operatorId: string): Promise<boolean> {
    const exists = await this.deviceModel.exists({ ip, operatorId, enabled: true });
    return Boolean(exists);
  }
}
