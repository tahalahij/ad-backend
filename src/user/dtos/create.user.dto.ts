import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'jackdorsi' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: 'jack' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'thi$ i$ jacks pa33' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiPropertyOptional({ example: '11.10.4.2' })
  @IsString()
  @IsOptional()
  ip?: string;

  @ApiPropertyOptional({ example: '11.10.4.2' })
  @IsString()
  @IsOptional()
  mac?: string;
}
