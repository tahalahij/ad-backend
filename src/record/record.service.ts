import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Record } from './record.schema';
import { PaginationQueryDto } from './dtos/pagination.dto';
import { CreateRecordDto } from './dtos/create.record.dto';
import { RecordTypeEnum } from './enums/transaction.type.enum';
import { readFileSync } from 'fs';
import { join } from 'path';

@Injectable()
export class RecordService {
  private logger = new Logger(RecordService.name);
  constructor(@InjectModel(Record.name) private recordModel: Model<Record>) {}

  async createRecord(userId: string, body: CreateRecordDto, type: RecordTypeEnum): Promise<Record> {
    const record = await this.recordModel.create({
      type,
      userId,
      amount: body.amount,
      createdAt: new Date(),
    });
    this.logger.log('Record created', { record });
    return record;
  }
  async getRecords(userId: mongoose.Types.ObjectId, query: PaginationQueryDto): Promise<Record[]> {
    const limit = query.limit || 10;
    const page = query.page || 0;
    return this.recordModel.find(
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

  async upload(file: Express.Multer.File): Promise<void> {
    try {
      // fs.writeFileSync('/Users/joe/test.txt', file);
      // file written successfully
    } catch (err) {
      console.error(err);
    }
  }

  fileBuffer(fileName: string) {
    return readFileSync(join(process.cwd(), `/files/${fileName}`));
  }
}
