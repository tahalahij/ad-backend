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
      .limit(limit);
  }
  async getCurrentSchedule(ip: string): Promise<Schedule> {
    // TODO fix
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
    this.logger.log('ingetSchedule ', { ip });
    if (ip.slice(0, 7) == '::ffff:') {
      ip = ip.slice(7, ip.length);
    }
    let nextConductor;
    const schedule = await this.getCurrentSchedule(ip);

    this.logger.log({ schedule, ip });
    if (!schedule) {
      return null;
    }

    const conductor = await this.conductorModel.findById(schedule.conductor);
    this.logger.log({ conductor });
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
    // TODO RECURSIVE should not have overlap with RECURSIVE
    if (rest.type === ScheduleTypeEnum.RECURSIVE) {
      const schedules = await this.scheduleModel.find({
        'from.hour': { $gt: rest.from.hour },
        'to.hour': { $lt: rest.to.hour },
        deviceId: device.id,
        operator,
        $day: { $in: rest.day },
      });
      schedules.map((s) => {
        if (s.from.minute > rest.from.minute || s.to.minute < rest.to.minute) {
          const message = `There is a schedule that overlaps with this, schedule
           id: ${s._id}, from : ${s.from.hour}:${s.from.minute} -  ${s.to.hour}:${s.to.minute},  in ${s.day.filter(
            (d) => rest.day.includes(d),
          )} days`;
          throw new BadRequestException(message);
        }
      });
    }
    //
    return this.scheduleModel.create({ deviceId: device.id, operator, ip, createdAt: new Date(), conductor, ...rest });
  }
  async getOperatorsSchedules(operator: string): Promise<Schedule[]> {
    return this.scheduleModel.find({ operator });
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
