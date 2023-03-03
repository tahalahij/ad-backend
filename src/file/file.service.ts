import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
// import * as ffmpeg from 'fluent-ffmpeg';
import { File, FileDocument } from './file.schema';
import { PaginationQueryDto } from './dtos/pagination.dto';
import { readFileSync } from 'fs';
import { join } from 'path';
import { UserService } from '../user/user.service';
import { Schedule } from './schedule.schema';
import { UploadDto } from './dtos/upload.dto';
import { ScheduleBodyDto } from './dtos/schedule.body.dto';

@Injectable()
export class FileService {
  private logger = new Logger(FileService.name);
  constructor(
    @InjectModel(File.name) private fileModel: Model<File>,
    @InjectModel(Schedule.name) private scheduleModel: Model<Schedule>,
    private userService: UserService,
  ) {}

  async createFile(ownerId: string, file: Express.Multer.File, uploadDto: UploadDto): Promise<FileDocument> {
    const fileDoc = await this.fileModel.create({
      ownerId,
      path: file.path,
      name: file.filename,
      animationName: uploadDto.animationName,
      delay: uploadDto.delay,
      type: file.mimetype.split('/')[0],
      createdAt: new Date(),
    });
    this.logger.log('File created', { fileDoc });
    return fileDoc;
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

  async getSchedule(ip: string): Promise<File> {
    if (ip.slice(0, 7) == '::ffff:') {
      ip = ip.slice(7, ip.length);
    }
    await this.userService.findByIp(ip);
    let nextConductor;
    const schedule = await this.scheduleModel.findOne({ ip });
    if (!schedule) {
      throw new NotFoundException(`No schedule found for ip: ${ip}`);
    }
    if (schedule.conductor.length < 1) {
      throw new NotFoundException(`Conductor is empty for ip: ${ip}`);
    }
    if (!schedule.lastShown) {
      nextConductor = schedule.conductor[0];
    } else {
      let index = schedule.conductor.indexOf(schedule.lastShown);
      index = index === schedule.conductor.length - 1 ? 0 : index + 1;
      nextConductor = schedule.conductor[index];
    }
    schedule.lastShown = nextConductor;
    schedule.save();

    return this.fileModel.findById(nextConductor);
  }
  async upsertSchedule(operator: string, body: ScheduleBodyDto): Promise<Schedule> {
    const schedule = await this.scheduleModel.findOneAndUpdate(
      { ip: body.ip, operator },
      { conductor: body.conductor },
      { upsert: true, new: true },
    );
    return schedule;
  }
  async getOperatorsSchedules(operator: string): Promise<Schedule[]> {
    return this.scheduleModel.find({ operator });
  }

  // async createThumbnail(filePath: string, storePath: string) {
  //   ffmpeg(filePath)
  //     .takeScreenshots(
  //       {
  //         count: 1,
  //         timemarks: ['2'], // number of seconds
  //       },
  //       storePath,
  //     )
  //     .on('end', function (Thumbnail) {
  //       console.log('Screenshots taken', { Thumbnail });
  //     });
  //   return true;
  // }
}
