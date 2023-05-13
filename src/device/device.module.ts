import { forwardRef, Module } from '@nestjs/common';
import { DeviceService } from './device.service';
import { DeviceController } from './device.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Device, DeviceSchema } from './device.schema';
import { ScheduleModule } from '../schedule/schedule.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Device.name, schema: DeviceSchema }]),
    forwardRef(() => ScheduleModule),
    forwardRef(() => UserModule),
  ],
  providers: [DeviceService],
  controllers: [DeviceController],
  exports: [DeviceService],
})
export class DeviceModule {}
