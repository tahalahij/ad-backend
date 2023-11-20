import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../schedule/dtos/pagination.dto';

export class GetConductorsByAdminDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: '644550b75d9d22cbc8055c71', description: 'id of operator' })
  @IsOptional()
  @IsString()
  operator?: string;


  @ApiPropertyOptional({ example: '644550b75d9d22cbc8055c71', description: 'searchable' })
  @IsOptional()
  @IsString()
  name?: string;
}
