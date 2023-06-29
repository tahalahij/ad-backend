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
import * as fs from 'fs';
import { createReadStream, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { UploadDto } from './dtos/upload.dto';
import * as Buffer from 'buffer';
import { PaginationQueryDto } from '../schedule/dtos/pagination.dto';
import { ConductorService } from '../schedule/conductor.service';
import * as XLSX from 'xlsx';
import { SystemSettingService } from '../system-settings/system-setting.service';
import { SystemSettingsEnum } from '../system-settings/enum/system-settings.enum';
import { ScheduleService } from '../schedule/schedule.service';
import * as moment from 'moment';
import { getAudioDurationInSeconds } from 'get-audio-duration';
import { AzanTypeEnum } from '../schedule/enums/azan.type.enum';
import * as NodeBuffer from 'node:buffer';

@Injectable()
export class FileService {
  private logger = new Logger(FileService.name);
  constructor(
    @InjectModel(File.name) private fileModel: Model<File>,
    @Inject(forwardRef(() => ConductorService)) private conductorService: ConductorService,
    @Inject(forwardRef(() => ScheduleService)) private scheduleService: ScheduleService,
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

  async uploadAzanXlsx(files: Express.Multer.File[]): Promise<void> {
    const dir = process.cwd() + '/temp/'; // files are stored in temp directory
    files.map((f) => {
      const buf = fs.readFileSync(dir + f.filename);
      const workBook = XLSX.read(buf);
      const jsonData = XLSX.utils.sheet_to_json(workBook.Sheets[workBook.SheetNames[0]]);
      const timeAndDates = jsonData.map((d) => {
        return { date: d['تاریخ میلادی'], noon: d['اذان ظهر'], vesper: d['اذان مغرب'], sunrise: d['اذان صبح'] };
      });
      timeAndDates.forEach((i) => {
        this.scheduleService.createAzanSchedule(i.date, i.sunrise, AzanTypeEnum.SUNRISE);
        this.scheduleService.createAzanSchedule(i.date, i.noon, AzanTypeEnum.NOON);
        this.scheduleService.createAzanSchedule(i.date, i.vesper, AzanTypeEnum.VESPER);
      });
    });

    for (const file of fs.readdirSync(dir)) {
      await fs.unlinkSync(dir + file);
    }
  }

  async uploadAzanFile(file: Express.Multer.File): Promise<void> {
    const dir = process.cwd() + '/files/azan/'; // files are stored in temp directory
    for (const fileName of fs.readdirSync(dir)) {
      // remove prevoius files
      if (fileName !== file.filename) {
        await fs.unlinkSync(dir + fileName);
      }
    }
    let duration = 70;
    if (file.mimetype.split('/')[0] === 'audio') {
      duration = await getAudioDurationInSeconds(dir + file.filename);
    } else if (file.mimetype.split('/')[0] === 'video') {
      const fsp = fs.promises;

      const buff = NodeBuffer.Buffer.alloc(100);
      const header = NodeBuffer.Buffer.from('mvhd');
      const f = await fsp.open(dir + file.filename, 'r');
      const { buffer } = await f.read(buff, 0, 100, 0);

      await f.close();

      const start = buffer.indexOf(header) + 17;
      const timeScale = buffer.readUInt32BE(start);
      const vidDuration = buffer.readUInt32BE(start + 4);

      duration = Math.floor((vidDuration / timeScale) * 1000) / 1000;
      // duration = await getVideoDurationInSeconds(dir + file.filename);
    }
    await this.systemSettingService.upsertSystemSetting(SystemSettingsEnum.AZAN_DURATION, duration);
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

  downloadAzan(): StreamableFile {
    const azanDir = join(process.cwd(), '/files/azan/');
    const fileNames = fs.readdirSync(azanDir);
    if (!fileNames.length) {
      throw new BadRequestException('فایل اذان اپلود نشده است');
    }
    console.log({ fileNames });
    const stream = createReadStream(join(azanDir, fileNames[0]));
    return new StreamableFile(stream);
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
