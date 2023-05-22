import { Injectable, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import { SystemSetting, SystemSettingDocument } from './system-setting.schema';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class SystemSettingService {
  constructor(@InjectModel(SystemSetting.name) private systemSettingModel: Model<SystemSetting>) {}

  async getSystemSetting(name: string): Promise<SystemSetting> {
    const systemSetting = await this.systemSettingModel.findOne({ name }).lean();
    if (!systemSetting) {
      throw new NotFoundException(' تنظیم سیستم پیدا نشد');
    }
    return systemSetting;
  }

  async updateSystemSetting(id: string, value: string): Promise<SystemSetting> {
    return this.systemSettingModel.findByIdAndUpdate(id, { value });
  }

  async getSystemSettings(): Promise<SystemSettingDocument[]> {
    return this.systemSettingModel.find({}).lean();
  }
}
