import { Injectable, Logger } from '@nestjs/common';
import { Model } from 'mongoose';
import { AuditLog } from './audit-logs.schema';
import { InjectModel } from '@nestjs/mongoose';
import paginate, { PaginationRes } from '../utils/pagination.util';
import { RolesType } from '../auth/role.type';
import { GetAuditLogsQueryDto } from './dtos/get.logs.query.dto';
import { OrderEnum } from '../schedule/enums/order.enum';

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

  async getLogs({ _sort, _order, limit, page, ...rest }: GetAuditLogsQueryDto): Promise<PaginationRes> {
    if (!_sort) {
      _sort = 'createdAt';
    }
    if (!_order) {
      _order = OrderEnum.DESC;
    }
    return paginate(this.auditLoggModel, rest, {
      page,
      limit,
      _sort,
      _order,
    });
  }
}
