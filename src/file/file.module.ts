import { forwardRef, Module } from '@nestjs/common';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { MongooseModule } from '@nestjs/mongoose';
import { File, FileSchema } from './file.schema';
import { MulterModule } from '@nestjs/platform-express';
import { DeviceModule } from '../device/device.module';
import { ScheduleModule } from '../schedule/schedule.module';
import { SystemSettingModule } from '../system-settings/system-setting.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: File.name, schema: FileSchema }]),
    MulterModule.register({}),
    SystemSettingModule,
    forwardRef(() => DeviceModule),
    forwardRef(() => ScheduleModule),
  ],
  providers: [FileService],
  controllers: [FileController],
  exports: [FileService],
})
export class FileModule {}
