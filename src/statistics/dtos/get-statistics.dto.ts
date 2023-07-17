import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../schedule/dtos/pagination.dto';

export class GetStatisticsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: '127.123.2.2', description: 'ip of device' })
  @IsOptional()
  @IsString()
  ip?: string;

  @ApiPropertyOptional({ example: '644550b75d9d22cbc8055c71', description: 'id of file' })
  @IsOptional()
  @IsString()
  fileId?: string;

  @ApiPropertyOptional({ example: 'image', description: 'typeof file can be one of image - video - audio' })
  @IsOptional()
  @IsString()
  fileType?: string;

  @ApiPropertyOptional({ example: '2023-04-23T15:37:27.650+00:00' })
  @IsDateString()
  start?: Date;

  @ApiPropertyOptional({ example: '2023-04-23T15:37:27.650+00:00' })
  @IsDateString()
  end?: Date;
}
