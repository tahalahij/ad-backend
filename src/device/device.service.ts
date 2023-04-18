import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import { Device, DeviceDocument } from './device.schema';
import { InjectModel } from '@nestjs/mongoose';
import { CreateDeviceDto } from './dtos/create.device.dto';
import { UpdateDeviceDto } from './dtos/update.device.dto';
import { DeviceSchedule } from './device.schadule.schema';
import { ScheduleService } from '../schedule/schedule.service';
import { Schedule } from '../schedule/schedule.schema';
import { File } from '../file/file.schema';

@Injectable()
export class DeviceService {
  constructor(
    @InjectModel(Device.name) private deviceModel: Model<Device>,

    @Inject(forwardRef(() => ScheduleService)) private scheduleService: ScheduleService,
    @InjectModel(DeviceSchedule.name) private deviceScheduleModel: Model<DeviceSchedule>,
  ) {}

  async createNewDevice(data: CreateDeviceDto): Promise<Device> {
    return this.deviceModel.create({
      ...data,
      createdAt: new Date(),
    });
  }

  async updateDevice(id: string, updateObj: UpdateDeviceDto): Promise<Device> {
    return this.deviceModel.findByIdAndUpdate(id, updateObj);
  }

  async getDevices(filter = {}): Promise<DeviceDocument[]> {
    return this.deviceModel.find({ filter });
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
}
