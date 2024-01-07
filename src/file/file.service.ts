import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
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
import { getAudioDurationInSeconds } from 'get-audio-duration';
import { AzanTypeEnum } from '../schedule/enums/azan.type.enum';
import * as NodeBuffer from 'node:buffer';
import { GetFilesByAdminDto } from './dtos/get-files-by-admin.dto';
import paginate, { PaginationRes } from '../utils/pagination.util';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { UserJwtPayload } from '../auth/user.jwt.type';
import { persianStringJoin } from '../utils/helper';
import * as os from 'os';
import { PanelFilesNameEnum } from './enums/panel.files.name.enum';

@Injectable()
export class FileService {
  private logger = new Logger(FileService.name);
  private rootDir = '../samand';
  constructor(
    @InjectModel(File.name) private fileModel: Model<File>,
    @Inject(forwardRef(() => ConductorService)) private conductorService: ConductorService,
    @Inject(forwardRef(() => ScheduleService)) private scheduleService: ScheduleService,
    @Inject(forwardRef(() => AuditLogsService)) private auditLogsService: AuditLogsService,
    private systemSettingService: SystemSettingService,
  ) {
    this.logger.log(' محل ذخیره سازی فایلها:', this.rootDir);
  }

  async createFile(
    initiator: UserJwtPayload,
    ownerId: string,
    file: Express.Multer.File,
    uploadDto: UploadDto,
  ): Promise<FileDocument> {
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
    this.auditLogsService.log({
      role: initiator.role,
      initiatorId: initiator.id,
      initiatorName: initiator.name,
      description: persianStringJoin([' اپلود فایل ', file.filename]),
    });
    this.logger.log('File created', { fileDoc });
    return fileDoc;
  }

  async uploadAzanXlsx(initiator: UserJwtPayload, files: Express.Multer.File[]): Promise<void> {
    const dir = this.rootDir + '/temp/'; // files are stored in temp directory
    const range = {
      start: null,
      end: null,
    };
    files.map((f) => {
      const buf = fs.readFileSync(dir + f.filename);
      const workBook = XLSX.read(buf);
      const jsonData = XLSX.utils.sheet_to_json(workBook.Sheets[workBook.SheetNames[0]]);
      const timeAndDates = jsonData.map((d) => {
        return { date: d['تاریخ میلادی'], noon: d['اذان ظهر'], vesper: d['اذان مغرب'], sunrise: d['اذان صبح'] };
      });

      range.start = timeAndDates[0].date; // for finding the first and last date
      range.end = timeAndDates[timeAndDates.length - 1].date; // for finding the first and last date

      timeAndDates.forEach((i) => {
        this.scheduleService.createAzanSchedule(i.date, i.sunrise, AzanTypeEnum.SUNRISE);
        this.scheduleService.createAzanSchedule(i.date, i.noon, AzanTypeEnum.NOON);
        this.scheduleService.createAzanSchedule(i.date, i.vesper, AzanTypeEnum.VESPER);
      });
    });

    for (const file of fs.readdirSync(dir)) {
      await fs.unlinkSync(dir + file);
    }
    this.auditLogsService.log({
      role: initiator.role,
      initiatorId: initiator.id,
      initiatorName: initiator.name,
      description: persianStringJoin(['   اپلود فایل زمان اذان ', range.start, ' تا ', range.end]),
    });
  }

  async uploadAzanFile(initiator: UserJwtPayload, file: Express.Multer.File): Promise<void> {
    const dir = this.rootDir + '/files/azan/'; // files are stored in temp directory
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
    } else {
      throw new BadRequestException(' فرمت فایل ارسالی پذیرفته نمیشود: تنها فایلهای mp3, mp4');
    }
    this.auditLogsService.log({
      role: initiator.role,
      initiatorId: initiator.id,
      initiatorName: initiator.name,
      description: '   اپلود فایل  اذان ',
    });
    await this.systemSettingService.upsertSystemSetting(SystemSettingsEnum.AZAN_DURATION, duration);
  }
  async getFiles(ownerId: mongoose.Types.ObjectId, paginationQuery: PaginationQueryDto): Promise<PaginationRes> {
    return paginate(this.fileModel, { ownerId }, paginationQuery);
  }

  async getFilesByAdmin({ operator, ...options }: GetFilesByAdminDto): Promise<PaginationRes> {
    const filter: any = {};
    if (operator) {
      filter.ownerId = operator;
    }

    return paginate(this.fileModel, filter, options);
  }
  async getFileById(id: string | mongoose.Types.ObjectId): Promise<FileDocument> {
    return this.fileModel.findById(id);
  }
  async countOperatorsFiles(ownerId: string): Promise<number> {
    return this.fileModel.count({ ownerId });
  }

  async deleteFile(initiator: UserJwtPayload, fileId: string): Promise<{ message: string }> {
    const file = await this.fileModel.findOne({ _id: fileId, ownerId: initiator.id });
    if (!file) {
      throw new NotFoundException('فایل پیدا نشد');
    }
    fs.unlink(join(this.rootDir, file.path), (param) => {
      this.logger.log('remove file', { param });
    });
    await this.conductorService.removeFileFromConductors(initiator, String(file._id));
    this.auditLogsService.log({
      role: initiator.role,
      initiatorId: initiator.id,
      initiatorName: initiator.name,
      description: persianStringJoin([' اپراتور فایل خود را پاک کرد', file.name]),
    });
    await file.remove();
    return { message: 'file removed from conductors as well' };
  }
  async adminDeleteFile(initiator: UserJwtPayload, fileId: string): Promise<{ message: string }> {
    const file = await this.fileModel.findOne({ _id: fileId });
    if (!file) {
      throw new NotFoundException('فایل پیدا نشد');
    }
    await this.conductorService.hasFileBeenUsed(fileId);
    fs.unlink(join(this.rootDir, file.path), (param) => {
      this.logger.log('remove file', { param });
    });
    await this.conductorService.removeFileFromConductors(initiator, String(file._id));
    this.auditLogsService.log({
      role: initiator.role,
      initiatorId: initiator.id,
      initiatorName: initiator.name,
      description: persianStringJoin(['  ادمین فایل را پاک کرد', file.name]),
    });
    await file.remove();
    return { message: 'file removed from conductors as well' };
  }

  getAzanType(): string {
    const azanDir = join(this.rootDir, '/files/azan/');
    const fileNames = fs.readdirSync(azanDir);
    if (!fileNames.length) {
      throw new BadRequestException('فایل اذان اپلود نشده است');
    }
    return lookup(fileNames[0]);
  }
  fileBuffer(fileName: string): Buffer.Buffer {
    return readFileSync(join(this.rootDir, `/files/${fileName}`));
  }

  downloadAzan(): StreamableFile {
    const azanDir = join(this.rootDir, '/files/azan/');
    const fileNames = fs.readdirSync(azanDir);
    if (!fileNames.length) {
      throw new BadRequestException('فایل اذان اپلود نشده است');
    }
    const stream = createReadStream(join(azanDir, fileNames[0]));
    return new StreamableFile(stream);
  }

  downloadPanelFile(fileName: PanelFilesNameEnum): StreamableFile {
    const files = readdirSync(join(this.rootDir, `/public`));
    let name = fileName.toLowerCase();
    if (files.length > 1) {
      name = files.find((f) => f.includes(name));
    } else {
      throw new InternalServerErrorException(` ${fileName}   فایل پنلی مورد نظر پیدا نشد: `);
    }
    const stream = createReadStream(join(this.rootDir, '/public', name));
    return new StreamableFile(stream);
  }

  fileStream(fileName: string): StreamableFile {
    const stream = createReadStream(join(this.rootDir, `/files/${fileName}`));
    return new StreamableFile(stream);
  }
}
