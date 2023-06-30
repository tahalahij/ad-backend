import { Body, Controller, Get, Logger, Post, Res, UseGuards, Response, Delete, Param, Query } from '@nestjs/common';
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
import { GetSchedulesByAdminDto } from './dtos/get-schedules-by-admin.dto';
import { OperatorIdQueryDto } from './dtos/operator.id.query.dto';
import { Azan } from './azan.schema';

@ApiTags('schedule')
@Controller('schedule')
export class ScheduleController {
  constructor(private scheduleService: ScheduleService) {}
  private logger = new Logger(ScheduleController.name);

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Operator creates its schedule' })
  @ApiResponse({ status: 200 })
  @UseGuards(JwtAuthGuard, RoleAccessCheck([RolesType.OPERATOR]))
  @Post('')
  async createSchedule(@UserId() adminId: string, @Body() scheduleBody: ScheduleBodyDto): Promise<Schedule> {
    const schedule = await this.scheduleService.createSchedule(adminId, scheduleBody);
    return schedule;
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin creates schedule for operator' })
  @ApiResponse({ status: 200 })
  @UseGuards(JwtAuthGuard, RoleAccessCheck([RolesType.ADMIN]))
  @Post('admin/:operatorId')
  async adminCreateSchedule(
    @Query() query: OperatorIdQueryDto,
    @Body() scheduleBody: ScheduleBodyDto,
  ): Promise<Schedule> {
    const schedule = await this.scheduleService.createSchedule(query.operatorId, scheduleBody);
    return schedule;
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Operator gets his own schedules' })
  @ApiResponse({ status: 200 })
  @UseGuards(JwtAuthGuard, RoleAccessCheck([RolesType.OPERATOR]))
  @Get('/operators')
  async getOperatorsSchedules(@UserId() operatorId: string): Promise<Schedule[]> {
    return this.scheduleService.getOperatorsSchedules(operatorId);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin gets schedules' })
  @ApiResponse({ status: 200 })
  @UseGuards(JwtAuthGuard, RoleAccessCheck([RolesType.ADMIN]))
  @Get('/admin')
  async adminGetSchedules(@Query() query: GetSchedulesByAdminDto): Promise<Schedule[]> {
    return this.scheduleService.getSchedules(query);
  }
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Controller gets schedules' })
  @ApiResponse({ status: 200 })
  @UseGuards(JwtAuthGuard, RoleAccessCheck([RolesType.CONTROLLER]))
  @Get('/controller')
  async controllerGetSchedules(@Query() query: GetSchedulesByAdminDto): Promise<Schedule[]> {
    return this.scheduleService.getSchedules(query);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'App gets schedule it supposed to show now' })
  @ApiResponse({ status: 200 })
  @Get('')
  async getSchedule(@Res({ passthrough: true }) res: Response, @RealIP() deviceIp: string): Promise<File> {
    const data = await this.scheduleService.getSchedule(deviceIp);
    return data?.file;
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'App gets todays azan timestamps, and duration' })
  @ApiResponse({ status: 200 })
  @Get('azan-time')
  async getAzanTime(
    @Res({ passthrough: true }) res: Response,
    @RealIP() deviceIp: string,
  ): Promise<{ azans: Azan[]; azanDurationInSec: number }> {
    return this.scheduleService.getAzanTimestamps();
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'App gets azan schedule' })
  @ApiResponse({ status: 200 })
  @Get('azan')
  async getAzan(@Res({ passthrough: true }) res: Response, @RealIP() deviceIp: string): Promise<File> {
    const data = await this.scheduleService.getSchedule(deviceIp);
    return data?.file;
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Operator removes schedule' })
  @UseGuards(JwtAuthGuard, RoleAccessCheck([RolesType.OPERATOR]))
  @Delete('/:id')
  async delSchedule(@Param('id') id: string, @UserId() adminId: string): Promise<Schedule> {
    return this.scheduleService.delete(adminId, id);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin removes schedule' })
  @UseGuards(JwtAuthGuard, RoleAccessCheck([RolesType.ADMIN]))
  @Delete('admin/:id')
  async adminDelSchedule(@Param('id') id: string): Promise<Schedule> {
    return this.scheduleService.adminDelete(id);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Operator get schedule by id' })
  @UseGuards(JwtAuthGuard, RoleAccessCheck([RolesType.OPERATOR]))
  @Get('/:id')
  async getScheduleById(@Param('id') id: string, @UserId() adminId: string): Promise<Schedule> {
    return this.scheduleService.getScheduleById(adminId, id);
  }
}
