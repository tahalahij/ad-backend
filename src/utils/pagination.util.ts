import { FilterQuery, Model } from 'mongoose';
import { PaginationQueryDto } from '../schedule/dtos/pagination.dto';
import { OrderEnum } from '../schedule/enums/order.enum';

export interface PaginationOptions extends PaginationQueryDto {
  populates?: string[];
}

export interface PaginationRes {
  data: any[];
  total: number;
}
export default async function paginate(
  model: Model<any>,
  where: FilterQuery<any>,
  { populates, page, limit, _sort, _order }: PaginationOptions,
): Promise<PaginationRes> {
  if (!page) {
    page = 0;
  }
  if (!limit) {
    limit = 10;
  }
  let query = model
    .find(where)
    .skip(limit * page)
    .limit(limit);
  if (populates && populates?.length) {
    populates.map((p) => {
      query = query.populate(p);
    });
  }

  const order = _order === OrderEnum.ASC ? 1 : -1;
  if (_sort) {
    query.sort({ [_sort]: order });
  }
  query.lean();

  const [data, total] = await Promise.all([query.exec(), model.count(where)]);
  return { data, total };
}
