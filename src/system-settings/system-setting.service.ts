import { forwardRef, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';
import { SystemSetting } from './system-setting.schema';
import { InjectModel } from '@nestjs/mongoose';
import { SystemSettingsEnum } from './enum/system-settings.enum';
import paginate, { PaginationRes } from '../utils/pagination.util';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { UserJwtPayload } from '../auth/user.jwt.type';
import { persianStringJoin } from '../utils/helper';

@Injectable()
export class SystemSettingService {
  private logger = new Logger(SystemSettingService.name);
  constructor(
    @InjectModel(SystemSetting.name) private systemSettingModel: Model<SystemSetting>,
    @Inject(forwardRef(() => AuditLogsService)) private auditLogsService: AuditLogsService,
  ) {}

  async getSystemSetting(name: SystemSettingsEnum): Promise<SystemSetting> {
    const systemSetting = await this.systemSettingModel.findOne({ name }).lean();
    if (!systemSetting) {
      throw new NotFoundException(' تنظیم سیستم پیدا نشد');
    }
    return systemSetting;
  }

  async updateSystemSetting(initiator: UserJwtPayload, id: string, value: string): Promise<SystemSetting> {
    const setting = await this.systemSettingModel.findById(id);
    this.auditLogsService.log({
      role: initiator.role,
      initiatorId: initiator.id,
      initiatorName: initiator.name,
      description: persianStringJoin([' ادمین تنظیمات', setting.name, '  را به مقدار ', setting.value, ' تغییر داد']),
    });
    return setting.update({ value });
  }

  async getSystemSettings(): Promise<PaginationRes> {
    return paginate(this.systemSettingModel, {}, {});
  }

  async upsertSystemSetting(name: SystemSettingsEnum, value: any): Promise<SystemSetting> {
    return this.systemSettingModel.findOneAndUpdate(
      { name },
      { value, createdAt: new Date() },
      { upsert: true, new: true },
    );
  }

  async seedSystemSetting() {
    const settings = await Promise.all([
      this.systemSettingModel.findOneAndUpdate(
        {
          name: SystemSettingsEnum.FILE_SIZE_LIMIT_IN_MEGA_BYTE,
        },
        {
          value: 100,
          createdAt: new Date(),
        },

        {
          upsert: true,
        },
      ),
      this.systemSettingModel.findOneAndUpdate(
        {
          name: SystemSettingsEnum.FILE_UPLOAD_LIMIT_PER_DAY,
        },
        {
          value: 10,
          createdAt: new Date(),
        },
        {
          upsert: true,
        },
      ),
    ]);
    this.logger.log('seedSystemSetting successful', { settings });
  }
}
