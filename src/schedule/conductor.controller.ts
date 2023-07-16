import { Body, Controller, Get, Logger, Post, UseGuards, Patch, Param, Query, Delete } from '@nestjs/common';
import { ConductorService } from './conductor.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserId } from '../auth/user.id.decorator';
import { Conductor } from './conductor.schema';
import { ConductorBodyDto } from './dtos/conductor.body.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RoleAccessCheck } from '../auth/role.access.guard';
import { RolesType } from '../auth/role.type';
import mongoose from 'mongoose';
import { PaginationQueryDto } from './dtos/pagination.dto';
import { GetConductorsByAdminDto } from './dtos/get-conductors-by-admin.dto';
import { AdminCreateConductorBodyDto } from './dtos/admin.create.conductor.body.dto';

@ApiTags('conductors')
@Controller('conductors')
export class ConductorController {
  constructor(private conductorService: ConductorService) {}
  private logger = new Logger(ConductorController.name);
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Operator creates conductor' })
  @ApiResponse({ status: 200 })
  @UseGuards(JwtAuthGuard, RoleAccessCheck([RolesType.OPERATOR]))
  @Post('')
  async createConductor(@UserId() adminId: string, @Body() conductorBody: ConductorBodyDto): Promise<Conductor> {
    const conductor = await this.conductorService.create(adminId, conductorBody);
    return conductor;
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin creates conductor' })
  @ApiResponse({ status: 200 })
  @UseGuards(JwtAuthGuard, RoleAccessCheck([RolesType.ADMIN]))
  @Post('admin')
  async adminCreateConductor(@Body() conductorBody: AdminCreateConductorBodyDto): Promise<Conductor> {
    const { operatorId, ...rest } = conductorBody;
    const conductor = await this.conductorService.create(operatorId, rest);
    return conductor;
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Operator updates its conductor' })
  @ApiResponse({ status: 200 })
  @UseGuards(JwtAuthGuard, RoleAccessCheck([RolesType.OPERATOR]))
  @Patch('/:id')
  async updateConductor(
    @Param('id') id: string,
    @UserId() adminId: string,
    @Body() conductorBody: ConductorBodyDto,
  ): Promise<Conductor> {
    return this.conductorService.update(adminId, id, conductorBody);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Operator removes its conductor' })
  @ApiResponse({ status: 200 })
  @UseGuards(JwtAuthGuard, RoleAccessCheck([RolesType.OPERATOR]))
  @Delete('/:id')
  async delConductor(@Param('id') id: string, @UserId() adminId: string): Promise<Conductor> {
    return this.conductorService.delete(adminId, id);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin or controller removes conductor' })
  @ApiResponse({ status: 200 })
  @UseGuards(JwtAuthGuard, RoleAccessCheck([RolesType.ADMIN, RolesType.CONTROLLER]))
  @Delete('/admin/:id')
  async adminDelConductor(@Param('id') id: string): Promise<Conductor> {
    return this.conductorService.adminDelete(id);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin or Controller gets conductors' })
  @ApiResponse({ status: 200, type: Conductor })
  @UseGuards(JwtAuthGuard, RoleAccessCheck([RolesType.ADMIN, RolesType.CONTROLLER]))
  @Get('/admin')
  async getConductors(@Query() query: GetConductorsByAdminDto): Promise<Conductor[]> {
    return this.conductorService.getOperatorsConductors(query);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Operator gets its conductors' })
  @ApiResponse({ status: 200, type: Conductor })
  @UseGuards(JwtAuthGuard, RoleAccessCheck([RolesType.OPERATOR]))
  @Get('/')
  async getFiles(@UserId() operator: string, @Query() queryDto: PaginationQueryDto): Promise<Conductor[]> {
    return this.conductorService.getOperatorsConductors({ operator, ...queryDto });
  }
}
