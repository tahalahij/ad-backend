import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class ScheduleBodyDto {
  @ApiProperty({ example: ['id1', 'id2'], description: 'id of files in order' })
  @IsArray()
  conductor: [string];

  @ApiProperty({ example: '11.22.33.2', description: 'ip of the device' })
  @IsString()
  ip: string;
}
