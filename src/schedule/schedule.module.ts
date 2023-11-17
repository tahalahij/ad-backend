import { forwardRef, Module } from '@nestjs/common';
import { ScheduleController } from './schedule.controller';
import { ScheduleService } from './schedule.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Schedule, ScheduleSchema } from './schedule.schema';
import { Conductor, ConductorSchema } from './conductor.schema';
import { FileModule } from '../file/file.module';
import { DeviceModule } from '../device/device.module';
import { StatisticsModule } from '../statistics/statistics.module';
import { ConductorService } from './conductor.service';
import { ConductorController } from './conductor.controller';
import { Azan, AzanSchema } from './azan.schema';
import { SystemSettingModule } from '../system-settings/system-setting.module';
import { Device, DeviceSchema } from '../device/device.schema';
import { AuditLogsModule } from "../audit-logs/audit-logs.module";

@Module({
  imports: [
    forwardRef(() => FileModule),
    forwardRef(() => DeviceModule),
    forwardRef(() => StatisticsModule),
    forwardRef(() => SystemSettingModule),
    forwardRef(() => AuditLogsModule),
    MongooseModule.forFeature([
      { name: Conductor.name, schema: ConductorSchema },
      { name: Schedule.name, schema: ScheduleSchema },
      { name: Azan.name, schema: AzanSchema },
      { name: Device.name, schema: DeviceSchema },
    ]),
  ],
  providers: [ScheduleService, ConductorService],
  controllers: [ScheduleController, ConductorController],
  exports: [ScheduleService, ConductorService],
})
export class ScheduleModule {}
