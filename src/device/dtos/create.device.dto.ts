import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateDeviceDto {
  @ApiProperty({ example: 'monitor 1' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'monitor 1' })
  @IsString()
  @IsNotEmpty()
  ip: string;

  @ApiPropertyOptional({ example: '123213' })
  @IsString()
  @IsOptional()
  mac?: string;

  @ApiProperty({ example: 'hjg213kh123j123' })
  @IsString()
  @IsNotEmpty()
  operatorId: string;
}
