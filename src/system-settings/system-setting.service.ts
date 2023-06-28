import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import { SystemSetting, SystemSettingDocument } from './system-setting.schema';
import { InjectModel } from '@nestjs/mongoose';
import { SystemSettingsEnum } from './enum/system-settings.enum';

@Injectable()
export class SystemSettingService {
  private logger = new Logger(SystemSettingService.name);
  constructor(@InjectModel(SystemSetting.name) private systemSettingModel: Model<SystemSetting>) {}

  async getSystemSetting(name: SystemSettingsEnum): Promise<SystemSetting> {
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

  async upsertSystemSetting(name: SystemSettingsEnum, value: any): Promise<SystemSetting> {
    return this.systemSettingModel.findOneAndUpdate(
      { name },
      { value, createdAt: new Date() },
      { upsert: true, new: true },
    );
  }

  async seedSystemSetting() {
    const admin = await this.systemSettingModel.create({
      createdAt: new Date(),
      name: SystemSettingsEnum.FILE_SIZE_LIMIT_IN_MEGA_BYTE,
      value: 100,
    });
    this.logger.log('seedSystemSetting successful', { admin });
  }
}
