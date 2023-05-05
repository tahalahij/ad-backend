import { Body, Controller, Get, Logger, Post, Res, UseGuards, Response, Patch, Param, Query } from '@nestjs/common';
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
  @Patch('/:id')
  async delConductor(
    @Param('id') id: string,
    @UserId() adminId: string,
    @Body() conductorBody: ConductorBodyDto,
  ): Promise<Conductor> {
    return this.conductorService.delete(adminId, id);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Operator gets its conductors' })
  @ApiResponse({ status: 200, type: Conductor })
  @UseGuards(JwtAuthGuard, RoleAccessCheck([RolesType.OPERATOR]))
  @Get('/')
  async getFiles(
    @UserId() operator: mongoose.Types.ObjectId,
    @Query() queryDto: PaginationQueryDto,
  ): Promise<Conductor[]> {
    return this.conductorService.getOperatorsConductors(operator, queryDto);
  }
}
