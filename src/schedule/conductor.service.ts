import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Conductor } from './conductor.schema';
import { PaginationQueryDto } from './dtos/pagination.dto';
import { ConductorBodyDto } from './dtos/conductor.body.dto';

@Injectable()
export class ConductorService {
  private logger = new Logger(ConductorService.name);
  constructor(@InjectModel(Conductor.name) private conductorModel: Model<Conductor>) {}

  async getOperatorsConductors(operator: mongoose.Types.ObjectId, query: PaginationQueryDto): Promise<Conductor[]> {
    const limit = query.limit || 10;
    const page = query.page || 0;
    return this.conductorModel.find(
      {
        operator,
      },
      {},
      {
        skip: limit * page,
        limit,
      },
    );
  }

  async create(operator: string, { conductor }: ConductorBodyDto): Promise<Conductor> {
    return this.conductorModel.create({ operator, conductor });
  }

  async update(operator: string, id: string, { conductor }: ConductorBodyDto): Promise<Conductor> {
    const exists = await this.conductorModel.findOne({ _id: id, operator });
    if (!exists) {
      throw new NotFoundException('conductor related to you not found');
    }
    return exists.update({ conductor });
  }

  async delete(operator: string, id: string): Promise<Conductor> {
    const exists = await this.conductorModel.findOne({ _id: id, operator });
    if (!exists) {
      throw new NotFoundException('conductor related to you not found');
    }
    return exists.remove();
  }
}
