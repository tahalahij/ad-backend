import { Module } from '@nestjs/common';
import { ScheduleController } from './schedule.controller';
import { ScheduleService } from './schedule.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Schedule, ScheduleSchema } from './schedule.schema';
import { Conductor, ConductorSchema } from './conductor.schema';
import { FileModule } from '../file/file.module';

@Module({
  imports: [
    FileModule,
    MongooseModule.forFeature([
      { name: Conductor.name, schema: ConductorSchema },
      { name: Schedule.name, schema: ScheduleSchema },
    ]),
  ],
  providers: [ScheduleService],
  controllers: [ScheduleController],
  exports: [ScheduleService],
})
export class ScheduleModule {}
