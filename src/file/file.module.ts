import { Module } from '@nestjs/common';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { MongooseModule } from '@nestjs/mongoose';
import { File, FileSchema } from './file.schema';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [MongooseModule.forFeature([{ name: File.name, schema: FileSchema }]), MulterModule.register({})],
  providers: [FileService],
  controllers: [FileController],
  exports: [FileService],
})
export class FileModule {}
