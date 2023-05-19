import { CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable, Logger } from '@nestjs/common';
import { parse } from 'path';
import { DeviceService } from '../device/device.service';

@Injectable()
export class IpAccessCheckGuard implements CanActivate {
  private logger = new Logger(IpAccessCheckGuard.name);
  constructor(@Inject(DeviceService) private deviceService: DeviceService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    let requestIp = request.ip;
    if (requestIp.slice(0, 7) == '::ffff:') {
      requestIp = requestIp.slice(7, requestIp.length);
    }
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
      throw new ForbiddenException(`You dont have accessed from this ip, your ip : ${requestIp}`);
    }
  }
}
