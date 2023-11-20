import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../schedule/dtos/pagination.dto';
import { ScheduleTypeEnum } from '../enums/schedule.type.enum';

export class GetSchedulesByAdminDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: '644550b75d9d22cbc8055c71', description: 'id of operator' })
  @IsOptional()
  @IsString()
  operator?: string;

  @ApiPropertyOptional({ example: '644550b75d9d22cbc8055c71', description: 'id of device' })
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiPropertyOptional({ example: '644550b75d9d22cbc8055c71', description: 'searchable' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '644550b75d9d22cbc8055c71', description: 'searchable' })
  @IsOptional()
  @IsString()
  ip?: string;

  @ApiPropertyOptional({ example: ScheduleTypeEnum.ONE_TIME, description: ' type of schedule' })
  @IsOptional()
  @IsEnum(ScheduleTypeEnum)
  type?: ScheduleTypeEnum;
}
