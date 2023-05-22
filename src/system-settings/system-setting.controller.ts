import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { SystemSettingService } from './system-setting.service';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SystemSetting, SystemSettingDocument } from './system-setting.schema';
import { RoleAccessCheck } from '../auth/role.access.guard';
import { RolesType } from '../auth/role.type';
import { UpdateSystemSettingDto } from './dtos/update.system.setting.dto';
import { SystemSettingsEnum } from './enum/system-settings.enum';

@ApiTags('system-settings')
@Controller('system-settings')
export class SystemSettingController {
  constructor(private systemSettingService: SystemSettingService) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin gets all system settings' })
  @ApiResponse({ status: 200, type: SystemSetting })
  @UseGuards(JwtAuthGuard, RoleAccessCheck([RolesType.ADMIN]))
  @Get('/admin')
  async getSystemSettings(): Promise<SystemSettingDocument[]> {
    return this.systemSettingService.getSystemSettings();
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin updates a system settings' })
  @ApiResponse({ status: 200, type: SystemSetting })
  @Patch('/admin/:id')
  @UseGuards(JwtAuthGuard, RoleAccessCheck([RolesType.ADMIN]))
  async updateSystemSetting(@Param('id') id: string, @Body() body: UpdateSystemSettingDto): Promise<SystemSetting> {
    return this.systemSettingService.updateSystemSetting(id, body.value);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'get SystemSetting by name' })
  @ApiResponse({ status: 200, type: SystemSetting })
  @Get('/:name')
  @UseGuards(JwtAuthGuard, RoleAccessCheck([RolesType.ADMIN]))
  async getSystemSetting(@Param('name') name: SystemSettingsEnum): Promise<SystemSetting> {
    return this.systemSettingService.getSystemSetting(name);
  }
}
