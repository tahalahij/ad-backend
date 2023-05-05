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

@Module({
  imports: [
    forwardRef(() => FileModule),
    forwardRef(() => DeviceModule),
    forwardRef(() => StatisticsModule),
    MongooseModule.forFeature([
      { name: Conductor.name, schema: ConductorSchema },
      { name: Schedule.name, schema: ScheduleSchema },
    ]),
  ],
  providers: [ScheduleService, ConductorService],
  controllers: [ScheduleController, ConductorController],
  exports: [ScheduleService],
})
export class ScheduleModule {}
