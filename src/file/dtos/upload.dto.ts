import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UploadDto {
  @ApiPropertyOptional({ example: 100, description: 'delay in seconds' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  delay?: number;

  @ApiPropertyOptional({ example: 'flip', description: 'name of animation to go to next conductor' })
  @IsOptional()
  @IsString()
  animationName?: string;
}
