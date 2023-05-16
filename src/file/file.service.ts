import { Injectable, Logger, StreamableFile } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { lookup } from 'mime-types';
import { File, FileDocument } from './file.schema';
import { createReadStream, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { UploadDto } from './dtos/upload.dto';
import * as Buffer from 'buffer';
import { PaginationQueryDto } from '../schedule/dtos/pagination.dto';

@Injectable()
export class FileService {
  private logger = new Logger(FileService.name);
  constructor(@InjectModel(File.name) private fileModel: Model<File>) {}

  async createFile(ownerId: string, file: Express.Multer.File, uploadDto: UploadDto): Promise<FileDocument> {
    const fileDoc = await this.fileModel.create({
      ownerId,
      path: file.path,
      name: file.filename,
      originalName: file.filename.split('-')[1] || file.filename,
      animationName: uploadDto?.animationName,
      delay: uploadDto?.delay,
      type: lookup(file.mimetype),
      createdAt: new Date(),
    });
    this.logger.log('File created', { fileDoc });
    return fileDoc;
  }
  async getFiles(userId: mongoose.Types.ObjectId, query: PaginationQueryDto): Promise<File[]> {
    const limit = query.limit || 10;
    const page = query.page || 0;
    return this.fileModel
      .find({
        userId,
      })
      .skip(limit * page)
      .limit(limit)
      .lean();
  }
  async getFileById(id: string | mongoose.Types.ObjectId): Promise<FileDocument> {
    return this.fileModel.findById(id);
  }

  fileBuffer(fileName: string): Buffer.Buffer {
    return readFileSync(join(process.cwd(), `/files/${fileName}`));
  }

  dashboard(): StreamableFile {
    const files = readdirSync(join(process.cwd(), `/public`));
    let name = 'dashboard_default.jpg';
    if (files.length > 1) {
      name = files.find((f) => f !== name);
    }
    const stream = createReadStream(join(process.cwd(), '/public', name));
    return new StreamableFile(stream);
  }

  fileStream(fileName: string): StreamableFile {
    const stream = createReadStream(join(process.cwd(), `/files/${fileName}`));
    return new StreamableFile(stream);
  }
}
