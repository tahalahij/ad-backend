import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'jackdorsi' })
  @IsString()
  @IsOptional()
  username?: string;

  @ApiPropertyOptional({ example: 'jack' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'thi$ i$ jacks pa33' })
  @IsString()
  @IsOptional()
  password?: string;

  @ApiPropertyOptional({ example: '11.10.4.2' })
  @IsString()
  @IsOptional()
  ip?: string;

  @ApiPropertyOptional({ example: '11.10.4.2' })
  @IsString()
  @IsOptional()
  mac?: string;
}
