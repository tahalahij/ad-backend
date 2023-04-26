import { Body, Controller, Get, Logger, Post, Res, UseGuards, Response } from '@nestjs/common';
import { ScheduleService } from './schedule.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserId } from '../auth/user.id.decorator';
import { Schedule } from './schedule.schema';
import { RealIP } from 'nestjs-real-ip';
import { ScheduleBodyDto } from './dtos/schedule.body.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RoleAccessCheck } from '../auth/role.access.guard';
import { RolesType } from '../auth/role.type';
import { File } from '../file/file.schema';
import { IpAccessCheckGuard } from '../auth/ip.access.guard';

@ApiTags('schedule')
@Controller('schedule')
export class ScheduleController {
  constructor(private scheduleService: ScheduleService) {}
  private logger = new Logger(ScheduleController.name);
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Operator updates or creates its schedule' })
  @ApiResponse({ status: 200 })
  @UseGuards(JwtAuthGuard, RoleAccessCheck([RolesType.OPERATOR]))
  @Post('schedule')
  async upsertSchedule(@UserId() adminId: string, @Body() scheduleBody: ScheduleBodyDto): Promise<Schedule> {
    const schedule = await this.scheduleService.upsertSchedule(adminId, scheduleBody);
    return schedule;
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Operator gets his own schedules' })
  @ApiResponse({ status: 200 })
  @UseGuards(JwtAuthGuard, RoleAccessCheck([RolesType.OPERATOR]))
  @Get('schedule/operators')
  async getOperatorsSchedules(@UserId() operatorId: string): Promise<Schedule[]> {
    return this.scheduleService.getOperatorsSchedules(operatorId);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'App gets schedule it supposed to show now' })
  @ApiResponse({ status: 200 })
  @UseGuards(IpAccessCheckGuard)
  @Get('schedule')
  async getSchedule(
    @Res({ passthrough: true }) res: Response,
    @RealIP() deviceIp: string,
  ): Promise<{ schedule: Schedule; file: File }> {
    return this.scheduleService.getSchedule(deviceIp);
  }
}
