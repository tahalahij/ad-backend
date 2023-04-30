import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Statistics, StatisticsDocument } from './statistics.schema';
import { GetStatisticsDto } from './dtos/get-statistics.dto';

@Injectable()
export class StatisticsService {
  private logger = new Logger(StatisticsService.name);
  constructor(@InjectModel(Statistics.name) private statisticsModel: Model<Statistics>) {}

  async createStatisticRecord({
    fileId,
    fileType,
    ip,
  }: {
    fileId: string;
    fileType: string;
    ip: string;
  }): Promise<StatisticsDocument> {
    const statisticsDoc = await this.statisticsModel.create({
      fileId,
      fileType,
      ip,
    });
    this.logger.log('Statistics created', { statisticsDoc });
    return statisticsDoc;
  }

  async getStatistics(dto: GetStatisticsDto): Promise<StatisticsDocument[]> {
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
      filter.fileType = dto.fileType;
    }

    if (dto.start) {
      filter.created_at['$gte'] = dto.start;
    }

    if (dto.end) {
      filter.created_at['$lte'] = dto.end;
    }
    return this.statisticsModel
      .find(
        filter,
        {},
        {
          skip: limit * page,
          limit,
        },
      )
      .lean();
  }
}
