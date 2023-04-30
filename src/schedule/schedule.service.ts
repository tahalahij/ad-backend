import { forwardRef, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Schedule } from './schedule.schema';
import { PaginationQueryDto } from './dtos/pagination.dto';
import { ScheduleBodyDto } from './dtos/schedule.body.dto';
import { Conductor } from './conductor.schema';
import moment from 'moment';
import { ScheduleTypeEnum } from './enums/schedule.type.enum';
import { FileService } from '../file/file.service';
import { File } from '../file/file.schema';
import { DeviceService } from '../device/device.service';
import { StatisticsService } from '../statistics/statistics.service';

@Injectable()
export class ScheduleService {
  private logger = new Logger(ScheduleService.name);
  constructor(
    @InjectModel(Schedule.name) private scheduleModel: Model<Schedule>,
    @InjectModel(Conductor.name) private conductorModel: Model<Conductor>,
    @Inject(forwardRef(() => FileService)) private fileService: FileService,
    @Inject(forwardRef(() => DeviceService)) private deviceService: DeviceService,
    @Inject(forwardRef(() => StatisticsService)) private statisticsService: StatisticsService,
  ) {}

  async getSchedules(userId: mongoose.Types.ObjectId, query: PaginationQueryDto): Promise<Schedule[]> {
    const limit = query.limit || 10;
    const page = query.page || 0;
    return this.scheduleModel.find(
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
  async getCurrentSchedule(ip: string): Promise<Schedule> {
    const now = moment();
    const day = now.format('dddd').toUpperCase();
    const minute = now.toDate().getMinutes();
    const hour = now.toDate().getHours();
    const onTime = await this.scheduleModel
      .findOne({ ip, type: ScheduleTypeEnum.ONE_TIME })
      .gte('start', now.toDate())
      .lte('end', now.toDate());
    if (onTime) {
      // one time has higher priority
      return onTime;
    }
    const recursive = await this.scheduleModel
      .find({ ip, day, type: ScheduleTypeEnum.RECURSIVE })
      .gte('from.hour', hour)
      .lte('to.hour', hour);
    if (!recursive.length) {
      return;
    }

    return recursive.find((s) => minute <= s.to.minute && minute >= s.from.minute);
  }

  async getSchedule(ip: string): Promise<{ schedule: Schedule; file: File }> {
    if (ip.slice(0, 7) == '::ffff:') {
      ip = ip.slice(7, ip.length);
    }
    let nextConductor;
    const schedule = await this.getCurrentSchedule(ip);
    if (!schedule) {
      return null;
    }

    const conductor = await this.conductorModel.findById(schedule.conductor);

    if (conductor.conductor.length < 1) {
      throw new NotFoundException(`Conductor is empty for ip: ${ip}`);
    }
    if (!conductor.nextIndex) {
      nextConductor = conductor.conductor[0];
    } else {
      nextConductor = conductor.nextIndex === conductor.conductor.length - 1 ? 0 : conductor.nextIndex + 1;
    }
    conductor.nextIndex = nextConductor;
    await conductor.save();
    const file = await this.fileService.getFileById(String(conductor.conductor[nextConductor]));
    await this.statisticsService.createStatisticRecord({
      ip,
      fileId: file._id,
      fileType: file.type,
    });
    return { schedule, file };
  }
  async upsertSchedule(operator: string, { ip, ...rest }: ScheduleBodyDto): Promise<Schedule> {
    const device = await this.deviceService.getDevice({ ip, operator });
    if (!device) {
      throw new NotFoundException(`Device doesnt exists with ip:${ip}, related to operator: ${operator}`);
    }
    const schedule = await this.scheduleModel.findOneAndUpdate({ deviceId: device.id, operator }, rest, {
      upsert: true,
      new: true,
    });
    return schedule;
  }
  async getOperatorsSchedules(operator: string): Promise<Schedule[]> {
    return this.scheduleModel.find({ operator });
  }
}
