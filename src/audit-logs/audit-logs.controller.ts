import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuditLog } from './audit-logs.schema';
import { RoleAccessCheck } from '../auth/role.access.guard';
import { RolesType } from '../auth/role.type';

import { PaginationRes } from '../utils/pagination.util';
import { GetAuditLogsQueryDto } from './dtos/get.logs.query.dto';

@ApiTags('audit-logs')
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private auditLogsService: AuditLogsService) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin or controller gets all audit logs ' })
  @ApiResponse({ status: 200, type: AuditLog })
  @UseGuards(JwtAuthGuard, RoleAccessCheck([RolesType.ADMIN, RolesType.CONTROLLER]))
  @Get('/')
  async getAuditLogs(@Query() queryDto: GetAuditLogsQueryDto): Promise<PaginationRes> {
    return this.auditLogsService.getLogs(queryDto);
  }
}
