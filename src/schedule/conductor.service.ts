import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Conductor } from './conductor.schema';
import { ConductorBodyDto } from './dtos/conductor.body.dto';
import { GetConductorsByAdminDto } from './dtos/get-conductors-by-admin.dto';

@Injectable()
export class ConductorService {
  private logger = new Logger(ConductorService.name);
  constructor(@InjectModel(Conductor.name) private conductorModel: Model<Conductor>) {}

  async getOperatorsConductors(query: GetConductorsByAdminDto): Promise<Conductor[]> {
    const { operator, ...rest } = query;
    const limit = rest.limit || 10;
    const page = rest.page || 0;
    const filter: any = {};
    if (operator) {
      filter.operator = operator;
    }
    return this.conductorModel
      .find(filter)
      .skip(limit * page)
      .limit(limit)
      .lean();
  }

  async create(operator: string, body: ConductorBodyDto): Promise<Conductor> {
    return this.conductorModel.create({ operator, ...body, createdAt: new Date() });
  }

  async removeFileFromConductors(fileId: string | mongoose.Types.ObjectId): Promise<any> {
    return this.conductorModel.updateMany({}, { $pull: { conductor: fileId } });
  }

  async update(operator: string, id: string, body: ConductorBodyDto): Promise<Conductor> {
    const exists = await this.conductorModel.findOne({ _id: id, operator });
    if (!exists) {
      throw new NotFoundException('کنداکتور مربوط به این اپراتور نیست');
    }
    return exists.update(body);
  }

  async delete(operator: string, id: string): Promise<Conductor> {
    const exists = await this.conductorModel.findOne({ _id: id, operator });
    if (!exists) {
      throw new NotFoundException('کنداکتور مربوط به این اپراتور نیست');
    }
    return exists.remove();
  }
  async adminDelete(id: string): Promise<Conductor> {
    const exists = await this.conductorModel.findOne({ _id: id });
    if (!exists) {
      throw new NotFoundException('کنداکتور وجود ندارد');
    }
    return exists.remove();
  }
}
