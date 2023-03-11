import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { DeviceService } from './device.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateDeviceDto } from './dtos/create.device.dto';
import { Device, DeviceDocument } from './device.schema';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GetDevicesQueryDto } from './dtos/get.devices.query.dto';
import { UpdateDeviceDto } from './dtos/update.device.dto';

@ApiTags('devices')
@Controller('devices')
export class DeviceController {
  constructor(private deviceService: DeviceService) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin gets all devices' })
  @ApiResponse({ status: 200, type: Device })
  @UseGuards(JwtAuthGuard)
  @Get('/admin')
  async getDevices(@Query() queryDto: GetDevicesQueryDto): Promise<DeviceDocument[]> {
    return this.deviceService.getDevices(queryDto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin creates a new device' })
  @ApiResponse({ status: 200, type: Device })
  @UseGuards(JwtAuthGuard)
  @Post('/admin')
  async addDevice(@Body() body: CreateDeviceDto): Promise<Device> {
    return this.deviceService.createNewDevice(body);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin updates a device' })
  @ApiResponse({ status: 200, type: Device })
  @UseGuards(JwtAuthGuard)
  @Post('/admin')
  async updateDevice(@Param('id') id: string, @Body() body: UpdateDeviceDto): Promise<Device> {
    return this.deviceService.updateDevice(id, body);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'get device by id' })
  @ApiResponse({ status: 200, type: Device })
  @UseGuards(JwtAuthGuard)
  @Get('/:id')
  async getDevice(@Param('id') id: string): Promise<DeviceDocument> {
    return this.deviceService.getDevice({ _id: id });
  }
}
