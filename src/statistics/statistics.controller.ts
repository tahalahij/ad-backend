import { Controller, Get, Logger, Post, Query, UseGuards } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Statistics } from './statistics.schema';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RoleAccessCheck } from '../auth/role.access.guard';
import { RolesType } from '../auth/role.type';
import { GetStatisticsDto } from './dtos/get-statistics.dto';

@ApiTags('statistics')
@Controller('statistics')
export class StatisticsController {
  constructor(private statisticsService: StatisticsService) {}
  private logger = new Logger(StatisticsController.name);

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin gets statistics with filter' })
  @ApiResponse({ status: 200, type: Statistics })
  @UseGuards(JwtAuthGuard, RoleAccessCheck([RolesType.ADMIN]))
  @Get('/')
  async getFiles(
    @Query() queryDto: GetStatisticsDto,
  ): Promise<{ details: IterableIterator<[any, any]>; statistics: Statistics[] }> {
    return this.statisticsService.getStatistics(queryDto);
  }
}
