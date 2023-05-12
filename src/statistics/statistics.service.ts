import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { lookup } from 'mime-types';
import { Statistics, StatisticsDocument } from './statistics.schema';
import { GetStatisticsDto } from './dtos/get-statistics.dto';
import { FileDocument } from '../file/file.schema';

@Injectable()
export class StatisticsService {
  private logger = new Logger(StatisticsService.name);
  constructor(@InjectModel(Statistics.name) private statisticsModel: Model<Statistics>) {}

  async createStatisticRecord({ file, ip }: { file: FileDocument; ip: string }): Promise<StatisticsDocument> {
    const statisticsDoc = await this.statisticsModel.create({
      fileId: file._id,
      duration: file.delay,
      fileType: lookup(file.type),
      ip,
    });
    this.logger.log('Statistics created', { statisticsDoc });
    return statisticsDoc;
  }

  async getStatistics(
    dto: GetStatisticsDto,
  ): Promise<{ details: IterableIterator<[any, any]>; statistics: Statistics[] }> {
    const limit = dto?.limit || 10;
    const page = dto?.page || 0;
    const filter: any = { created_at: { $lte: new Date() } };
    if (dto.ip) {
      filter.ip = dto.ip;
    }
    if (dto.fileId) {
      filter.fileId = dto.fileId;
    }
    if (dto.fileType) {
      filter.fileType = lookup(dto.fileType);
    }

    if (dto.start) {
      filter.created_at['$gte'] = dto.start;
    }

    if (dto.end) {
      filter.created_at['$lte'] = dto.end;
    }
    const statistics: Array<Statistics> = await this.statisticsModel
      .find(filter)
      .skip(limit * page)
      .limit(limit)
      .lean();
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
    };
  }
}
