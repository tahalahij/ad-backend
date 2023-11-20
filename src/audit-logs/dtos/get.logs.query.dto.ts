import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../schedule/dtos/pagination.dto';
import { RolesType } from '../../auth/role.type';

export class GetAuditLogsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: RolesType.CONTROLLER, enum: RolesType })
  @IsEnum(RolesType)
  @IsOptional()
  role?: RolesType;

  @ApiPropertyOptional({ example: 'hjg213kh123j123' })
  @IsString()
  @IsOptional()
  initiatorId?: string;

  @ApiPropertyOptional({ example: 'admin name', description: 'searchable' })
  @IsString()
  @IsOptional()
  initiatorName?: string;

  @ApiPropertyOptional({ example: 'admin updated dashboard pic', description: 'searchable' })
  @IsString()
  @IsOptional()
  description?: string;
}
