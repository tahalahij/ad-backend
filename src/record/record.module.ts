import { Module } from '@nestjs/common';
import { RecordController } from './record.controller';
import { RecordService } from './record.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Record, RecordSchema } from './record.schema';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [MongooseModule.forFeature([{ name: Record.name, schema: RecordSchema }]), MulterModule.register({})],
  providers: [RecordService],
  controllers: [RecordController],
})
export class RecordModule {}
