import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../schedule/dtos/pagination.dto';

export class GetDevicesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 'monitor 1, searchable' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'monitor 1, searchable' })
  @IsString()
  @IsOptional()
  ip?: string;

  @ApiPropertyOptional({ example: '123213, searchable' })
  @IsString()
  @IsOptional()
  mac?: string;

  @ApiPropertyOptional({ example: 'hjg213kh123j123' })
  @IsString()
  @IsOptional()
  operatorId?: string;
}
