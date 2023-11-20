import { BadRequestException, forwardRef, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Conductor } from './conductor.schema';
import { ConductorBodyDto } from './dtos/conductor.body.dto';
import { GetConductorsByAdminDto } from './dtos/get-conductors-by-admin.dto';
import { ScheduleService } from './schedule.service';
import paginate, { PaginationRes } from '../utils/pagination.util';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { likeRegx, persianStringJoin } from '../utils/helper';
import { UserJwtPayload } from '../auth/user.jwt.type';

@Injectable()
export class ConductorService {
  private logger = new Logger(ConductorService.name);
  constructor(
    @InjectModel(Conductor.name) private conductorModel: Model<Conductor>,
    @Inject(forwardRef(() => AuditLogsService)) private auditLogsService: AuditLogsService,
    private scheduleService: ScheduleService,
  ) {}

  async getOperatorsConductors(query: GetConductorsByAdminDto): Promise<PaginationRes> {
    const { operator, name, ...options } = query;

    const filter: any = {};
    if (operator) {
      filter.operator = operator;
    }

    if (name) {
      filter.name = likeRegx(name);
    }
    return paginate(this.conductorModel, filter, options);
  }

  async create(initiator: UserJwtPayload, operator: string, body: ConductorBodyDto): Promise<Conductor> {
    const schedule = await this.conductorModel.create({ operator, ...body, createdAt: new Date() });
    this.auditLogsService.log({
      role: initiator.role,
      initiatorId: initiator.id,
      initiatorName: initiator.name,
      description: persianStringJoin([' برنامه ایجاد شد', body.name, ' با شناسه', schedule._id.toString()]),
    });
    return schedule;
  }

  async hasFileBeenUsed(fileId: string): Promise<void> {
    const conductors = await this.conductorModel.find({ conductor: { $in: fileId } });
    if (conductors?.length) {
      const names = conductors.map((c) => c.name);
      const message = ` این فایل در سری ${names?.length > 1 ? 'ها' : ''}ی پخش  ${names} استفاده شده است:`;
      throw new BadRequestException(message);
    }
    return null;
  }

  async removeFileFromConductors(initiator: UserJwtPayload, fileId: string): Promise<any> {
    this.auditLogsService.log({
      role: initiator.role,
      initiatorId: initiator.id,
      initiatorName: initiator.name,
      description: persianStringJoin(['  فایل با شناسه', fileId, '  را از سری های پخش پاک کرد']),
    });
    return this.conductorModel.updateMany({}, { $pull: { conductor: fileId } });
  }

  async update(initiator: UserJwtPayload, operator: string, id: string, body: ConductorBodyDto): Promise<Conductor> {
    const exists = await this.conductorModel.findOne({ _id: id, operator });
    if (!exists) {
      throw new NotFoundException('کنداکتور مربوط به این اپراتور نیست');
    }
    this.auditLogsService.log({
      role: initiator.role,
      initiatorId: initiator.id,
      initiatorName: initiator.name,
      description: persianStringJoin(['  سری پخش ', exists.name, ' را اپدیت کرد']),
    });
    return exists.update(body);
  }

  async delete(initiator: UserJwtPayload, operator: string, id: string): Promise<Conductor> {
    const exists = await this.conductorModel.findOne({ _id: id, operator });
    if (!exists) {
      throw new NotFoundException('کنداکتور مربوط به این اپراتور نیست');
    }
    await this.scheduleService.hasConductorBeenUsed(id);
    this.auditLogsService.log({
      role: initiator.role,
      initiatorId: initiator.id,
      initiatorName: initiator.name,
      description: persianStringJoin([' اپراتور سری پخش ', exists.name, ' را پاک کرد']),
    });
    return exists.remove();
  }
  async adminDelete(initiator: UserJwtPayload, id: string): Promise<Conductor> {
    const exists = await this.conductorModel.findOne({ _id: id });
    if (!exists) {
      throw new NotFoundException('کنداکتور وجود ندارد');
    }
    await this.scheduleService.hasConductorBeenUsed(id);
    this.auditLogsService.log({
      role: initiator.role,
      initiatorId: initiator.id,
      initiatorName: initiator.name,
      description: persianStringJoin([' ادمین سری پخش ', exists.name, ' را پاک کرد']),
    });
    return exists.remove();
  }
}
