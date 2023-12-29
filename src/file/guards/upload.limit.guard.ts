import { CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable, Logger } from '@nestjs/common';
import { SystemSettingService } from '../../system-settings/system-setting.service';
import { SystemSettingsEnum } from '../../system-settings/enum/system-settings.enum';
import { FileService } from '../file.service';

@Injectable()
export class UploadLimitGuard implements CanActivate {
  private logger = new Logger(UploadLimitGuard.name);
  constructor(
    @Inject(SystemSettingService) private systemSettingService: SystemSettingService,
    @Inject(FileService) private fileService: FileService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const user = request.user;
    const ownerId = user.id;
    const limit = await this.systemSettingService.getSystemSetting(SystemSettingsEnum.FILE_UPLOAD_LIMIT_PER_DAY);
    const count = await this.fileService.countOperatorsFiles(ownerId);
    this.logger.log('in UploadLimitGuard', {
      ownerId,
      limit: limit.value,
      count,
    });

    if (count < Number(limit.value)) {
      return true;
    } else {
      throw new ForbiddenException('شما به سقف مجاز اپلود فایل در روز رسیده اید');
    }
  }
}
