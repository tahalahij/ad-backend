import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class CreateRecordDto {
  @ApiProperty({ example: 20000 })
  @IsNumber()
  amount: number;
}
