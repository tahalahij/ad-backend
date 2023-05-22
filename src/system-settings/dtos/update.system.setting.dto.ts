import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateSystemSettingDto {
  @ApiPropertyOptional({ example: '400' })
  @IsString()
  @IsNotEmpty()
  value: string;
}
