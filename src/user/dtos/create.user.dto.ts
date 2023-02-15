import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

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

  @ApiProperty({ example: '11.10.4.2' })
  @IsString()
  @IsNotEmpty()
  ip: string;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {}
