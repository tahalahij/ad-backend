import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class OperatorUpdateOwnDto {
  @ApiProperty({ example: 'thi$ i$ jacks pa33' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
