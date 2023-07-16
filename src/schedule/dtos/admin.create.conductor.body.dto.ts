import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { ConductorBodyDto } from './conductor.body.dto';

export class AdminCreateConductorBodyDto extends ConductorBodyDto {
  @ApiProperty({ example: 'hjg213kh123j123' })
  @IsString()
  @IsNotEmpty()
  operatorId: string;
}
