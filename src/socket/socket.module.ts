import { forwardRef, Module } from '@nestjs/common';
import { SocketService } from './socket.service';
import { DeviceModule } from '../device/device.module';

@Module({
  imports: [forwardRef(() => DeviceModule)],
  providers: [SocketService],
})
export class SocketModule {}
