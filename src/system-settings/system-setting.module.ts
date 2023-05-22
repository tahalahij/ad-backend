import { Module } from '@nestjs/common';
import { SystemSettingService } from './system-setting.service';
import { SystemSettingController } from './system-setting.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { SystemSetting, SystemSettingSchema } from './system-setting.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: SystemSetting.name, schema: SystemSettingSchema }])],
  providers: [SystemSettingService],
  controllers: [SystemSettingController],
  exports: [SystemSettingService],
})
export class SystemSettingModule {}
