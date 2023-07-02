import { CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable, Logger } from '@nestjs/common';
import { parse } from 'path';
import { DeviceService } from '../device/device.service';
import { RolesType } from './role.type';
import { handleIPV6 } from '../utils/helper';

@Injectable()
export class IpAccessCheckGuard implements CanActivate {
  private logger = new Logger(IpAccessCheckGuard.name);
  constructor(@Inject(DeviceService) private deviceService: DeviceService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const requestIp = handleIPV6(request.ip);
    this.logger.log('in IpAccessCheckGuard', { requestIp });
    const { fileName } = request.params;

    const filename: string = parse(fileName).name;

    const ownerId = filename.substring(filename.lastIndexOf('-') + 1, filename.length);
    const match = await this.deviceService.checkDeviceIpMatchesOperator(requestIp, ownerId);
    this.logger.log(fileName, {
      requestIp,
      ownerId,
      match,
    });

    if (match) {
      return true;
    } else {
      throw new ForbiddenException(`شما از این ایپی نمیتوانید دسترسی پیدا بکنید ایپی شما: ${requestIp} `);
    }
  }
}
