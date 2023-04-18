import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { DeviceService } from './device.service';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateDeviceDto } from './dtos/create.device.dto';
import { Device, DeviceDocument } from './device.schema';
import { GetDevicesQueryDto } from './dtos/get.devices.query.dto';
import { UpdateDeviceDto } from './dtos/update.device.dto';
import { RoleAccessCheck } from '../auth/role.access.guard';
import { RolesType } from '../auth/role.type';
import { UserId } from '../auth/user.id.decorator';
import { Schedule } from '../schedule/schedule.schema';
import { File } from '../file/file.schema';

@ApiTags('devices')
@Controller('devices')
export class DeviceController {
  constructor(private deviceService: DeviceService) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin gets all devices' })
  @ApiResponse({ status: 200, type: Device })
  @UseGuards(JwtAuthGuard)
  @UseGuards(RoleAccessCheck([RolesType.ADMIN]))
  @Get('/admin')
  async getDevices(@Query() queryDto: GetDevicesQueryDto): Promise<DeviceDocument[]> {
    return this.deviceService.getDevices(queryDto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Operator gets all his devices' })
  @ApiResponse({ status: 200, type: Device })
  @UseGuards(JwtAuthGuard)
  @UseGuards(RoleAccessCheck([RolesType.OPERATOR]))
  @Get('/')
  async getOperatorsDevices(@UserId() operatorId: string): Promise<DeviceDocument[]> {
    return this.deviceService.getDevices({ operatorId });
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin creates a new device' })
  @ApiResponse({ status: 200, type: Device })
  @UseGuards(JwtAuthGuard)
  @UseGuards(RoleAccessCheck([RolesType.ADMIN]))
  @Post('/admin')
  async addDevice(@Body() body: CreateDeviceDto): Promise<Device> {
    return this.deviceService.createNewDevice(body);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin updates a device' })
  @ApiResponse({ status: 200, type: Device })
  @UseGuards(JwtAuthGuard)
  @Patch('/admin')
  @UseGuards(RoleAccessCheck([RolesType.ADMIN]))
  async updateDevice(@Param('id') id: string, @Body() body: UpdateDeviceDto): Promise<Device> {
    return this.deviceService.updateDevice(id, body);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'get device by id' })
  @ApiResponse({ status: 200, type: Device })
  @UseGuards(JwtAuthGuard)
  @Get('/:id')
  @UseGuards(RoleAccessCheck([RolesType.ADMIN, RolesType.OPERATOR]))
  async getDevice(@Param('id') id: string): Promise<DeviceDocument> {
    return this.deviceService.getDevice({ _id: id });
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin gets current schedule of device' })
  @ApiResponse({ status: 200 })
  @UseGuards(JwtAuthGuard)
  @UseGuards(RoleAccessCheck([RolesType.ADMIN]))
  @Get('/admin/schedule/:deviceId')
  async getSchedule(@Param('deviceId') deviceId: string): Promise<{ schedule: Schedule; file: File }> {
    return this.deviceService.getDevicesCurrentSchedule(deviceId);
  }
}
