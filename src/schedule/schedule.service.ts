import { BadRequestException, forwardRef, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Schedule } from './schedule.schema';
import { PaginationQueryDto } from './dtos/pagination.dto';
import { ScheduleBodyDto } from './dtos/schedule.body.dto';
import { Conductor } from './conductor.schema';
import * as moment from 'moment';
import { ScheduleTypeEnum } from './enums/schedule.type.enum';
import { FileService } from '../file/file.service';
import { File } from '../file/file.schema';
import { DeviceService } from '../device/device.service';
import { StatisticsService } from '../statistics/statistics.service';
import { isDefined } from 'class-validator';

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
    return this.scheduleModel
      .find({
        userId,
      })
      .skip(limit * page)
      .limit(limit)
      .lean();
  }
  async getCurrentSchedule(ip: string): Promise<Schedule> {
    const now = moment();
    const day = now.format('dddd').toUpperCase();
    const minute = now.toDate().getMinutes();
    const hour = now.toDate().getHours();
    this.logger.log('in getCurrentSchedule ', { now, day, minute, hour });
    const oneTime = await this.scheduleModel
      .findOne({ ip, type: ScheduleTypeEnum.ONE_TIME })
      .lte('start', now.toDate())
      .gte('end', now.toDate());
    this.logger.log('in getCurrentSchedule oneTime ', { oneTime });
    if (oneTime) {
      // one time has higher priority
      return oneTime;
    }
    const recursive: Schedule[] = await this.scheduleModel
      .find({ ip, day, type: ScheduleTypeEnum.RECURSIVE })
      .lte('from.hour', hour)
      .gte('to.hour', hour)
      .lean();
    this.logger.log('in getCurrentSchedule recursive ', { recursive });
    if (!recursive.length) {
      return;
    }

    return recursive.find((s) => {
      return moment().isBetween(
        moment().hour(s.from.hour).minute(s.from.minute),
        moment().hour(s.to.hour).minute(s.to.minute),
      );
    });
  }

  async getSchedule(ip: string): Promise<{ schedule: Schedule; file: File }> {
    this.logger.log('in getSchedule ', { ip });
    if (ip.slice(0, 7) == '::ffff:') {
      ip = ip.slice(7, ip.length);
    }
    const schedule = await this.getCurrentSchedule(ip);

    this.logger.log('getSchedule ', { schedule, ip });
    if (!schedule) {
      return null;
    }

    const conductor = await this.conductorModel.findById(schedule.conductor);
    this.logger.log({ conductor });
    if (conductor.conductor.length < 1) {
      throw new NotFoundException(`Conductor is empty for ip: ${ip}`);
    }
    const nextIndex = isDefined(conductor.nextIndex)
      ? conductor.nextIndex === conductor.conductor.length - 1 // end of conductor list
        ? 0 // start from beginning
        : conductor.nextIndex + 1 //next file
      : 0; // start from beginning

    conductor.nextIndex = nextIndex;
    await conductor.save();
    const file = await this.fileService.getFileById(String(conductor.conductor[nextIndex]));
    this.logger.log({ file });
    await this.statisticsService.createStatisticRecord({
      ip,
      file,
    });
    return { schedule, file };
  }
  async createSchedule(operator: string, { ip, conductor, ...rest }: ScheduleBodyDto): Promise<Schedule> {
    const device = await this.deviceService.getDevice({ ip, operator });
    if (!device) {
      throw new NotFoundException(`Device doesnt exists with ip:${ip}, related to operator: ${operator}`);
    }
    const exists = await this.conductorModel.exists({ _id: conductor, operator });
    if (!exists) {
      throw new NotFoundException(`Conductor doesnt exists with id:${conductor}}, related to operator: ${operator}`);
    }
    // TODO one times should not have overlap with one time
    if (rest.type === ScheduleTypeEnum.RECURSIVE) {
      const recursive = await this.scheduleModel
        .find({ ip, day: rest.day, type: ScheduleTypeEnum.RECURSIVE, deviceId: device.id, operator })
        .lte('from.hour', rest.from.hour)
        .gte('to.hour', rest.to.hour)
        .lean();

      recursive.forEach((r) => {
        const from = moment().hour(rest.from.hour).minute(rest.from.minute);
        const to = moment().hour(rest.to.hour).minute(rest.to.minute);
        const fromOverlap = from.isBetween(
          moment().hour(r.from.hour).minute(r.from.minute),
          moment().hour(r.to.hour).minute(r.to.minute),
        );
        const toOverlap = to.isBetween(
          moment().hour(r.from.hour).minute(r.from.minute),
          moment().hour(r.to.hour).minute(r.to.minute),
        );
        const message = `There is a schedule that overlaps with this, schedule
           id: ${r._id}, ${fromOverlap ? `from: ${r.from.hour}:${r.from.minute}` : ''} ${
          toOverlap ? `to: ${r.to.hour}:${r.to.minute}` : ''
        },  in ${r.day.filter((d) => rest.day.includes(d))} days`;
        throw new BadRequestException(message);
      });
    } else {
      // one time
      const oneTimes = await this.scheduleModel.find({
        ip,
        type: ScheduleTypeEnum.ONE_TIME,
        deviceId: device.id,
        operator,
      });
      oneTimes.forEach((ot: any) => {
        const start = moment(rest.start);
        const end = moment(rest.end);
        const startOverlap = start.isBetween(moment(ot.start), moment(ot.end));
        const endOverlap = end.isBetween(moment(ot.start), moment(ot.end));

        if (startOverlap || endOverlap) {
          const message = `There is a schedule that overlaps with this, schedule
           id: ${ot._id}, ${ot.start} - ${ot.end}`;
          throw new BadRequestException(message);
        }
      });
    }
    //
    return this.scheduleModel.create({ deviceId: device.id, operator, ip, createdAt: new Date(), conductor, ...rest });
  }
  async getOperatorsSchedules(operator: string): Promise<Schedule[]> {
    return this.scheduleModel.find({ operator }).lean();
  }
  async getScheduleById(operator: string, id: string): Promise<Schedule> {
    return this.scheduleModel.findOne({ operator, _id: id });
  }

  async delete(operator: string, id: string): Promise<Schedule> {
    const exists = await this.scheduleModel.findOne({ _id: id, operator });
    if (!exists) {
      throw new NotFoundException('Schedule related to you not found');
    }
    return exists.remove();
  }
}
