import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { Transform, Type } from 'class-transformer';

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

  @ApiPropertyOptional({ example: true })
  @Transform(({ value }) => {
    // eslint-disable-next-line max-len
    return value === 'true' || value === true; // the filed is coming from query so is string, the second check is this function is being called twice so the second time it's boolean
  })
  enabled?: boolean;
}
