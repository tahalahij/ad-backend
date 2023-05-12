import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class ConductorBodyDto {
  @ApiProperty({ example: ['id1', 'id2'], description: 'id of files in order' })
  @IsArray()
  @IsNotEmpty()
  conductor: [string];

  @ApiProperty({ example: 'saturdays conductor', description: 'name of the conductor' })
  @IsNotEmpty()
  @IsString()
  name: string;
}
