import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { EventsEnum, RoomsEnum } from './enums/events.enum';
import { handleIPV6 } from '../utils/helper';
import { DeviceService } from '../device/device.service';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';

@Injectable()
export class SocketService {
  private logger = new Logger(SocketService.name);
  private io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>;
  constructor(@Inject(forwardRef(() => DeviceService)) private deviceService: DeviceService) {
    this.io = new Server(+process.env.WS_PORT, {
      cors: {
        origin: process.env.CORS_ORIGINS.split(','),
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
      },
    });
    this.io.on('connect', this.onConnect.bind(this));
  }

  async onConnect(socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) {
    const ip = handleIPV6(socket.handshake.address);
    this.logger.log('connected with ip', ip);
    const device = await this.deviceService
      .getDevice({
        ip,
      })
      .catch((e) => null);
    if (device) {
      // it a monitor
      this.logger.log('connected device', { device });
      this.io.to(RoomsEnum.ALL).emit(EventsEnum.DEVICE_CONNECTED, { deviceId: device.id });
    } else {
      // admin, controller or operator
      socket.join(RoomsEnum.ALL);
      const sockets = await this.io.sockets.fetchSockets();
      const activeDevices = await Promise.all(
        sockets.map(async (s) => {
          const device = await this.deviceService
            .getDevice({
              ip: handleIPV6(s?.handshake?.address),
            })
            .catch((e) => null);
          return device;
        }),
      );
      this.logger.log('admin, controller or operator connected and activeDevices sent', { activeDevices });
      const activeDevicesIds = activeDevices.filter((d) => d !== null).map((d) => d['_id']);

      this.logger.log('activeDevices sending', { activeDevicesIds });
      socket.emit(EventsEnum.ALL_ACTIVE_DEVICES, { activeDevices: activeDevicesIds });
    }

    socket.on('disconnect', () => {
      if (device) {
        // it a monitor
        this.logger.log('disconnected device', { device });
        this.io.to(RoomsEnum.ALL).emit(EventsEnum.DEVICE_DISCONNECTED, { deviceId: device._id });
      }
    });
  }
}
