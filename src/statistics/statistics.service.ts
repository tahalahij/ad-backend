import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { lookup } from 'mime-types';
import { Statistics, StatisticsDocument } from './statistics.schema';
import { GetStatisticsDto } from './dtos/get-statistics.dto';
import { FileDocument } from '../file/file.schema';
import paginate from '../utils/pagination.util';

@Injectable()
export class StatisticsService {
  private logger = new Logger(StatisticsService.name);
  constructor(@InjectModel(Statistics.name) private statisticsModel: Model<Statistics>) {}

  async createStatisticRecord({ file, ip }: { file: FileDocument; ip: string }): Promise<StatisticsDocument> {
    const statisticsDoc = await this.statisticsModel.create({
      fileId: file._id,
      duration: file.delay,
      fileType: file.type,
      ip,
      createdAt: new Date(),
    });
    this.logger.log('Statistics created', { statisticsDoc });
    return statisticsDoc;
  }

  async getStatistics({
    ip,
    fileType,
    fileId,
    start,
    end,
    ...options
  }: GetStatisticsDto): Promise<{ total: number; details: IterableIterator<[any, any]>; statistics: any[] }> {
    const filter: any = { created_at: { $lte: new Date() } };
    if (ip) {
      filter.ip = ip;
    }
    if (fileId) {
      filter.fileId = fileId;
    }
    if (fileType) {
      filter.fileType = fileType || 'image';
    }

    if (start) {
      filter.created_at['$gte'] = start;
    }

    if (end) {
      filter.created_at['$lte'] = end;
    }
    const { total, data: statistics } = await paginate(this.statisticsModel, filter, {
      ...options,
      populates: ['fileId'],
    });

    const details = new Map();
    statistics.map((s) => {
      if (details.has(s.fileType)) {
        details.set(s.fileType, details.get(s.fileType) + s.duration);
      } else {
        details.set(s.fileType, s.duration);
      }
    });

    return {
      statistics,
      details: details.entries(),
      total,
    };
  }
}
