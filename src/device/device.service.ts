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
    const operator = await this.userService.getOperatorById(data.operatorId);
    if (!operator) {
      throw new BadRequestException('اپراتور پیدا نشد');
    }

    const exists = await this.deviceModel.findOne({ ip: data.ip });
    if (exists) {
      throw new BadRequestException('دستگاه با این ایپی وجود ندارد');
    }

    return this.deviceModel.create({
      ...data,
      createdAt: new Date(),
    });
  }

  async updateDevice(id: string, updateObj: UpdateDeviceDto): Promise<Device> {
    if (updateObj.ip) {
      const countSimilarIP = await this.deviceModel.count({ ip: updateObj.ip });
      if (countSimilarIP > 1) {
        throw new BadRequestException('دستگاه با این ایپی وجود ندارد');
      }
    }
    return this.deviceModel.findByIdAndUpdate(id, updateObj);
  }

  async getDevices({ _sort, _order, limit, page, ...rest }: GetDevicesQueryDto): Promise<DeviceDocument[]> {
    limit = limit || 10;
    page = page || 0;
    return this.deviceModel
      .find({ ...rest })
      .skip(limit * page)
      .limit(limit)
      .populate('operatorId')
      .lean();
  }

  async getDevice(filter = {}): Promise<DeviceDocument> {
    const device = await this.deviceModel.findOne(filter);
    if (!device) {
      throw new NotFoundException(`دستگاه پیدا نشد`);
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
