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

@Injectable()
export class DeviceService {
  constructor(
    @InjectModel(Device.name) private deviceModel: Model<Device>,

    @Inject(forwardRef(() => UserService)) private userService: UserService,
    @Inject(forwardRef(() => ScheduleService)) private scheduleService: ScheduleService,
  ) {}

  async createNewDevice(data: CreateDeviceDto): Promise<Device> {
    const opearator = await this.userService.getOperatorById(data.operatorId);
    if (!opearator) {
      throw new BadRequestException("Operator not found");
    }
    return this.deviceModel.create({
      ...data,
      createdAt: new Date(),
    });
  }

  async updateDevice(id: string, updateObj: UpdateDeviceDto): Promise<Device> {
    return this.deviceModel.findByIdAndUpdate(id, updateObj);
  }

  async getDevices({ _sort, _order, limit, page, ...rest }: GetDevicesQueryDto): Promise<DeviceDocument[]> {
    limit = limit || 10;
    page = page || 0;
    return this.deviceModel
      .find({ ...rest })
      .skip(limit * page)
      .limit(limit);
  }

  async getDevice(filter = {}): Promise<DeviceDocument> {
    const device = await this.deviceModel.findOne(filter);
    if (!device) {
      throw new NotFoundException(`Device not found for: ${JSON.stringify(filter)}`);
    }
    return device;
  }

  async getDevicesCurrentSchedule(deviceId: string): Promise<{ schedule: Schedule; file: File }> {
    const device = await this.getDevice({ _id: deviceId });
    return this.scheduleService.getSchedule(device.ip);
  }
  async checkDeviceIpMatchesOperator(ip: string, operatorId: string): Promise<boolean> {
    const exists = await this.deviceModel.exists({ ip, operatorId });
    return Boolean(exists);
  }
}
