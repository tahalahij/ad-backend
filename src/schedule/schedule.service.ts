import { BadRequestException, forwardRef, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Schedule } from './schedule.schema';
import { ScheduleBodyDto } from './dtos/schedule.body.dto';
import { Conductor } from './conductor.schema';
import * as moment from 'moment';
import { ScheduleTypeEnum } from './enums/schedule.type.enum';
import { FileService } from '../file/file.service';
import { File } from '../file/file.schema';
import { DeviceService } from '../device/device.service';
import { StatisticsService } from '../statistics/statistics.service';
import { isDefined } from 'class-validator';
import { GetSchedulesByAdminDto } from './dtos/get-schedules-by-admin.dto';
import { Azan } from './azan.schema';
import { AzanTypeEnum } from './enums/azan.type.enum';
import { Moment } from 'moment';
import { handleIPV6 } from 'src/utils/helper';
import { SystemSettingService } from '../system-settings/system-setting.service';
import { SystemSettingsEnum } from '../system-settings/enum/system-settings.enum';

@Injectable()
export class ScheduleService {
  private logger = new Logger(ScheduleService.name);
  constructor(
    @InjectModel(Schedule.name) private scheduleModel: Model<Schedule>,
    @InjectModel(Azan.name) private azanModel: Model<Azan>,
    @InjectModel(Conductor.name) private conductorModel: Model<Conductor>,
    @Inject(forwardRef(() => FileService)) private fileService: FileService,
    @Inject(forwardRef(() => DeviceService)) private deviceService: DeviceService,
    @Inject(forwardRef(() => StatisticsService)) private statisticsService: StatisticsService,
    @Inject(forwardRef(() => SystemSettingService)) private systemSettingService: SystemSettingService,
  ) {}

  async getSchedules(query: GetSchedulesByAdminDto): Promise<Schedule[]> {
    const limit = query?.limit || 10;
    const page = query?.page || 0;
    const where: any = {};
    if (query.operator) {
      where.operator = query.operator;
    }
    if (query.deviceId) {
      where.device = query.deviceId;
    }
    const schedules: Schedule[] = await this.scheduleModel
      .find(where)
      .skip(limit * page)
      .limit(limit)
      .populate('operator')
      .populate('conductor')
      .populate('device')
      .lean();
    return schedules;
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

    this.logger.log('in getCurrentSchedule recursive, filter', { hour, day, ip });
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
      const from = moment().hour(s.from.hour).minute(s.from.minute);
      const to = moment().hour(s.to.hour).minute(s.to.minute);
      const now = moment();
      this.logger.log('find matching schedules', { from, now, to });
      return now.isBetween(from, to);
    });
  }
  async hasConductorBeenUsed(conductorId: string): Promise<void> {
    const schedules = await this.scheduleModel.find({ conductor: conductorId });
    if (schedules?.length) {
      const names = schedules.map((s) => s.name);
      const message = ` این سری پخش در برنامه ${names?.length > 1 ? 'ها' : ''}ی ${names}  استفاده شده است`;
      throw new BadRequestException(message);
    }
    return null;
  }

  async getSchedule(ip: string): Promise<{ schedule: Schedule; file: File }> {
    this.logger.log('in getSchedule ', { ip });
    ip = handleIPV6(ip);
    const schedule = await this.getCurrentSchedule(ip);

    this.logger.log('getSchedule ', { schedule, ip });
    if (!schedule) {
      return null;
    }

    const conductor = await this.conductorModel.findById(schedule.conductor);
    this.logger.log({ conductor });
    if (conductor.conductor.length < 1) {
      throw new NotFoundException(`کنداکتور مربوط به این ایپی پیدا نشد: ${ip}`);
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
  async createSchedule(operator: string, { deviceId, conductor, ...rest }: ScheduleBodyDto): Promise<Schedule> {
    const device = await this.deviceService.getDevice({ _id: deviceId, operator });
    if (!device) {
      throw new NotFoundException(`دستگاه با شناسه ${deviceId} مربوط به اپراتور ${operator} پیدا نشد`);
    }
    const exists = await this.conductorModel.exists({ _id: conductor, operator });
    if (!exists) {
      throw new NotFoundException(`کنداکتور با شناسه ${conductor} مربوط به اپراتور ${operator} پیدا نشد`);
    }
    if (rest.type === ScheduleTypeEnum.RECURSIVE) {
      const recursives = await this.scheduleModel
        .find({ type: ScheduleTypeEnum.RECURSIVE, device: device.id, operator })
        .lean();
      recursives.forEach((r) => {
        const intersectDays = r.day.filter((day) => rest.day.includes(day));
        if (intersectDays.length) {
          const from = moment().hour(rest.from.hour).minute(rest.from.minute).unix();
          const to = moment().hour(rest.to.hour).minute(rest.to.minute).unix();
          const recursiveFrom = moment().hour(r.from.hour).minute(r.from.minute).unix();
          const recursiveTo = moment().hour(r.to.hour).minute(r.to.minute).unix();
          const maxOfStarts = Math.max(from, recursiveFrom);
          const minOfEnds = Math.min(to, recursiveTo);
          if (maxOfStarts < minOfEnds) {
            const message = ` برنامه ${r.name} با این برنامه در روزهای ${intersectDays}تداخل دارد `;
            throw new BadRequestException(message);
          }
        }
      });
    } else {
      // one time
      const oneTimes = await this.scheduleModel.find({
        type: ScheduleTypeEnum.ONE_TIME,
        device: device.id,
        operator,
      });
      oneTimes.forEach((ot: any) => {
        const start = moment(rest.start);
        const end = moment(rest.end);
        const startOverlap = start.isBetween(moment(ot.start), moment(ot.end));
        const endOverlap = end.isBetween(moment(ot.start), moment(ot.end));

        if (startOverlap || endOverlap) {
          const message = ` برنامه ${ot.name} با این برنامه تداخل دارد`;
          throw new BadRequestException(message);
        }
      });
    }
    //
    return this.scheduleModel.create({
      device: deviceId,
      operator,
      ip: device.ip,
      createdAt: new Date(),
      conductor,
      ...rest,
    });
  }

  async createAzanSchedule(date: string, start: string, type: AzanTypeEnum) {
    const [hour, minute, second] = start.split(':');
    // to override existing azans for that day

    await this.azanModel.findOneAndUpdate(
      {
        date,
        type,
      },
      {
        start: moment(date, 'YYYY-MM-DD').minute(Number(minute)).hour(Number(hour)).second(Number(second)).toDate(),
        createdAt: new Date(),
      },
      { upsert: true, new: true },
    );
  }
  async getOperatorsSchedules(operator: string): Promise<Schedule[]> {
    return this.scheduleModel.find({ operator }).populate('device').lean();
  }
  async getScheduleById(operator: string, id: string): Promise<Schedule> {
    return this.scheduleModel.findOne({ operator, _id: id });
  }

  async delete(operator: string, id: string): Promise<Schedule> {
    const exists = await this.scheduleModel.findOne({ _id: id, operator });
    if (!exists) {
      throw new NotFoundException('برنامه مروبط به این اپراتور پیدا نشد');
    }
    return exists.remove();
  }

  async getAzanTimestamps(): Promise<{ azans: Azan[]; azanDurationInSec: number }> {
    const date = moment().format('YYYY/MM/DD');
    console.log({ date });
    const azans = await this.azanModel.find({
      date,
      start: { $gte: new Date() },
    });
    const azanDurationInSec = await this.systemSettingService.getSystemSetting(SystemSettingsEnum.AZAN_DURATION);
    return {
      azans,
      azanDurationInSec: Number(azanDurationInSec?.value || 120),
    };
  }
  async adminDelete(id: string): Promise<Schedule> {
    const exists = await this.scheduleModel.findOne({ _id: id });
    if (!exists) {
      throw new NotFoundException('برنامه مروبط به این اپراتور پیدا نشد');
    }
    return exists.remove();
  }
}
