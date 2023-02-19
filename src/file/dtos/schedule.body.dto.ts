import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional } from 'class-validator';

export class ScheduleBodyDto {
  @ApiPropertyOptional({ example: ['id1', 'id2'], description: 'id of files in order' })
  @IsOptional()
  @IsArray()
  conductor: [string];
}
