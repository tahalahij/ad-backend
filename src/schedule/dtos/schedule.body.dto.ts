import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ScheduleTypeEnum } from '../enums/schedule.type.enum';
import { WeekDays } from '../enums/week.enum';
import { Type } from 'class-transformer';

export class PointInTimeDto {
  @ApiProperty({ example: 2 })
  @IsNumber()
  hour: number;

  @ApiProperty({ example: 2 })
  @IsNumber()
  minute: number;
}
export class ScheduleBodyDto {
  @ApiProperty({ example: 'id1', description: 'id of conductor' })
  @IsString()
  @IsNotEmpty()
  conductor: string;

  @ApiProperty({ example: 'scheulde 1', description: 'name of schedule' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '[644550b75d9d22cbc8055c71]', description: 'deviceIds' })
  @IsArray()
  @IsString({ each: true })
  deviceIds: string[];

  @ApiProperty({
    example: ScheduleTypeEnum.ONE_TIME,
    description: 'if RECURSIVE then use the (from , to , day) if ONE_TIME then use (start, end)',
  })
  @IsEnum(ScheduleTypeEnum)
  @IsNotEmpty()
  type: ScheduleTypeEnum;

  @ApiPropertyOptional({ example: [WeekDays.FRIDAY, WeekDays.MONDAY], description: 'if RECURSIVE then use this' })
  @IsOptional()
  @IsArray()
  @IsEnum(WeekDays, { each: true })
  day?: WeekDays[];

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => PointInTimeDto)
  @IsObject()
  @ValidateNested()
  from?: PointInTimeDto;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => PointInTimeDto)
  @IsObject()
  @ValidateNested()
  to?: PointInTimeDto;

  @ApiPropertyOptional({ example: '2023-04-23T15:37:27.650+00:00' })
  @IsOptional()
  @IsDateString()
  start?: Date;

  @ApiPropertyOptional({ example: '2023-04-23T15:37:27.650+00:00' })
  @IsOptional()
  @IsDateString()
  end?: Date;
}
