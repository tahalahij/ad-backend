import { ApiProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';

export class ConductorBodyDto {
  @ApiProperty({ example: ['id1', 'id2'], description: 'id of files in order' })
  @IsArray()
  conductor: [string];
}
