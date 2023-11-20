import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../schedule/dtos/pagination.dto';

export class GetUsersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 'jackdorsi', description: 'searchable' })
  @IsString()
  @IsOptional()
  username?: string;

  @ApiProperty({ example: 'jackdorsi', description: 'searchable' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: '192.168.1.1', description: 'searchable' })
  @IsString()
  @IsOptional()
  ip?: string;

  @ApiProperty({ example: '43:21:34:12:42:12', description: 'searchable' })
  @IsString()
  @IsOptional()
  mac?: string;
}
