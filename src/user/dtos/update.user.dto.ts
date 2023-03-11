import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'jackdorsi' })
  @IsString()
  username?: string;

  @ApiPropertyOptional({ example: 'jack' })
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'thi$ i$ jacks pa33' })
  @IsString()
  password?: string;

  @ApiPropertyOptional({ example: '11.10.4.2' })
  @IsString()
  ip?: string;

  @ApiPropertyOptional({ example: '11.10.4.2' })
  @IsString()
  mac?: string;
}
