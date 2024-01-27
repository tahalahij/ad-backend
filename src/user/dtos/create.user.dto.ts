import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { RolesType } from '../../auth/role.type';
import { Transform } from 'class-transformer';

export class CreateUserDto {
  @ApiProperty({ example: 'jackdorsi' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: 'jack' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: RolesType.CONTROLLER, enum: RolesType })
  @IsEnum(RolesType)
  @IsNotEmpty()
  role: RolesType;

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

  @Transform(({ value }) => {
    // eslint-disable-next-line max-len
    return value === 'true' || value === true; // the filed is coming from query so is string, the second check is this function is being called twice so the second time it's boolean
  })
  @IsBoolean()
  enabled: boolean;
}
