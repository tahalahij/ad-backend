import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { lookup } from 'mime-types';
import { File, FileDocument } from './file.schema';
import { createReadStream, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { UploadDto } from './dtos/upload.dto';
import * as Buffer from 'buffer';
import { PaginationQueryDto } from '../schedule/dtos/pagination.dto';
import { ConductorService } from '../schedule/conductor.service';
import * as fs from 'fs';
import { SystemSettingService } from '../system-settings/system-setting.service';
import { SystemSettingsEnum } from '../system-settings/enum/system-settings.enum';

@Injectable()
export class FileService {
  private logger = new Logger(FileService.name);
  constructor(
    @InjectModel(File.name) private fileModel: Model<File>,
    @Inject(forwardRef(() => ConductorService)) private conductorService: ConductorService,
    private systemSettingService: SystemSettingService,
  ) {}

  async createFile(ownerId: string, file: Express.Multer.File, uploadDto: UploadDto): Promise<FileDocument> {
    const sizeLimit = await this.systemSettingService.getSystemSetting(SystemSettingsEnum.FILE_SIZE_LIMIT_IN_MEGA_BYTE);
    if (10 ** 6 * Number(sizeLimit.value) < file.size) {
      throw new BadRequestException(`فایل نمیتواند از  ${sizeLimit.value} مگابایت بزرگتر باشد`);
    }
    const fileDoc = await this.fileModel.create({
      ownerId,
      path: file.path,
      name: file.filename,
      originalName: file.filename.split('-')[1] || file.filename,
      animationName: uploadDto?.animationName,
      delay: uploadDto?.delay,
      type: (lookup(file.filename) || 'image/').split('/')[0],
      createdAt: new Date(),
    });
    this.logger.log('File created', { fileDoc });
    return fileDoc;
  }
  async getFiles(ownerId: mongoose.Types.ObjectId, query: PaginationQueryDto): Promise<File[]> {
    const limit = query.limit || 10;
    const page = query.page || 0;
    return this.fileModel
      .find({
        ownerId,
      })
      .skip(limit * page)
      .limit(limit)
      .lean();
  }
  async getFileById(id: string | mongoose.Types.ObjectId): Promise<FileDocument> {
    return this.fileModel.findById(id);
  }

  async deleteFile(admin: string, fileId: string): Promise<{ message: string }> {
    const file = await this.fileModel.findOne({ _id: fileId, ownerId: admin });
    if (!file) {
      throw new NotFoundException('فایل پیدا نشد');
    }
    fs.unlink(join(process.cwd(), file.path), (param) => {
      this.logger.log('remove file', { param });
    });
    await this.conductorService.removeFileFromConductors(file._id);
    await file.remove();
    return { message: 'file removed from conductors as well' };
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
