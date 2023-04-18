import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, IsEnum } from 'class-validator';
import { OrderEnum } from '../enums/order.enum';

export class PaginationQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;

  @ApiPropertyOptional({ example: OrderEnum.DESC, enum: OrderEnum })
  @IsOptional()
  @IsEnum(OrderEnum)
  _order?: OrderEnum;

  @ApiPropertyOptional({ example: 'createdAt' })
  @IsOptional()
  @IsString()
  _sort?: string;
}
