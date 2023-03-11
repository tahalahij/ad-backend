import { Injectable, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import { Device, DeviceDocument } from './device.schema';
import { InjectModel } from '@nestjs/mongoose';
import { CreateDeviceDto } from './dtos/create.device.dto';
import { UpdateDeviceDto } from './dtos/update.device.dto';

@Injectable()
export class DeviceService {
  constructor(@InjectModel(Device.name) private deviceModel: Model<Device>) {}

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
}
