import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsDateString, IsEnum, IsNumber, IsObject, IsString, ValidateNested } from 'class-validator';
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
  conductor: string;

  @ApiProperty({ example: '11.22.33.2', description: 'ip of the device' })
  @IsString()
  ip: string;

  @ApiProperty({
    example: ScheduleTypeEnum.ONE_TIME,
    description: 'if RECURSIVE then use the (from , to , day) if ONE_TIME then use (start, end)',
  })
  @IsEnum(ScheduleTypeEnum)
  type: ScheduleTypeEnum;

  @ApiProperty({ example: [WeekDays.FRIDAY, WeekDays.MONDAY], description: 'if RECURSIVE then use this' })
  @IsArray()
  @IsEnum(ScheduleTypeEnum, { each: true })
  day: WeekDays[];
  WeekDays;

  @Type(() => PointInTimeDto)
  @ApiProperty()
  @IsObject()
  @ValidateNested()
  from: PointInTimeDto;

  @Type(() => PointInTimeDto)
  @ApiProperty()
  @IsObject()
  @ValidateNested()
  to: PointInTimeDto;

  @ApiProperty({ example: '2023-04-23T15:37:27.650+00:00' })
  @IsDateString()
  start: Date;

  @ApiProperty({ example: '2023-04-23T15:37:27.650+00:00' })
  @IsDateString()
  end: Date;
}
