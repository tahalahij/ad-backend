import { Module } from '@nestjs/common';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { MongooseModule } from '@nestjs/mongoose';
import { File, FileSchema } from './file.schema';
import { MulterModule } from '@nestjs/platform-express';
import { Schedule, ScheduleSchema } from './schedule.schema';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    UserModule,
    MongooseModule.forFeature([
      { name: File.name, schema: FileSchema },
      { name: Schedule.name, schema: ScheduleSchema },
    ]),
    MulterModule.register({}),
  ],
  providers: [FileService],
  controllers: [FileController],
})
export class FileModule {}
