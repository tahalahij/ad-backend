import { Injectable, Logger } from '@nestjs/common';
import { FilterQuery, Model } from 'mongoose';
import { AuditLog } from './audit-logs.schema';
import { InjectModel } from '@nestjs/mongoose';
import paginate, { PaginationRes } from '../utils/pagination.util';
import { RolesType } from '../auth/role.type';
import { GetAuditLogsQueryDto } from './dtos/get.logs.query.dto';
import { OrderEnum } from '../schedule/enums/order.enum';
import { Device } from '../device/device.schema';
import { likeRegx } from '../utils/helper';

@Injectable()
export class AuditLogsService {
  private logger = new Logger(AuditLogsService.name);
  constructor(@InjectModel(AuditLog.name) private auditLoggModel: Model<AuditLog>) {}

  async log(data: {
    initiatorName: string;
    initiatorId: string;
    role: RolesType;
    description: string;
  }): Promise<AuditLog> {
    return this.auditLoggModel.create({ ...data, createdAt: new Date() });
  }

  async getLogs({
    initiatorName,
    description,
    initiatorId,
    role,
    ...rest
  }: GetAuditLogsQueryDto): Promise<PaginationRes> {
    if (!rest?._sort) {
      rest._sort = 'createdAt';
    }
    if (!rest?._order) {
      rest._order = OrderEnum.DESC;
    }
    const filter: FilterQuery<AuditLog> = {};
    if (initiatorName) {
      filter.initiatorName = likeRegx(initiatorName);
    }
    if (description) {
      filter.description = likeRegx(description);
    }
    if (initiatorId) {
      filter.initiatorId = initiatorId;
    }
    if (role) {
      filter.role = role;
    }

    return paginate(this.auditLoggModel, filter, rest);
  }
}
