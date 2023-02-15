import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { File } from './file.schema';
import { PaginationQueryDto } from './dtos/pagination.dto';
import { readFileSync } from 'fs';
import { join } from 'path';

@Injectable()
export class FileService {
  private logger = new Logger(FileService.name);
  constructor(@InjectModel(File.name) private fileModel: Model<File>) {}

  async createFile(ownerId: string, path: string): Promise<File> {
    const file = await this.fileModel.create({
      ownerId,
      path,
      createdAt: new Date(),
    });
    this.logger.log('File created', { file });
    return file;
  }
  async getFiles(userId: mongoose.Types.ObjectId, query: PaginationQueryDto): Promise<File[]> {
    const limit = query.limit || 10;
    const page = query.page || 0;
    return this.fileModel.find(
      {
        userId,
      },
      {},
      {
        skip: limit * page,
        limit,
      },
    );
  }

  fileBuffer(fileName: string) {
    return readFileSync(join(process.cwd(), `/files/${fileName}`));
  }
}
