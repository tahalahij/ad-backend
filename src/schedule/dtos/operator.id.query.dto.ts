import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class OperatorIdQueryDto {
  @ApiProperty({ example: 'monitor 1' })
  @IsString()
  @IsNotEmpty()
  operatorId: string;
}
