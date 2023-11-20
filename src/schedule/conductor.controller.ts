import { Body, Controller, Get, Logger, Post, UseGuards, Patch, Param, Query, Delete } from '@nestjs/common';
import { ConductorService } from './conductor.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserId } from '../auth/user.id.decorator';
import { Conductor } from './conductor.schema';
import { ConductorBodyDto } from './dtos/conductor.body.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RoleAccessCheck } from '../auth/role.access.guard';
import { RolesType } from '../auth/role.type';
import { PaginationQueryDto } from './dtos/pagination.dto';
import { GetConductorsByAdminDto } from './dtos/get-conductors-by-admin.dto';
import { AdminCreateConductorBodyDto } from './dtos/admin.create.conductor.body.dto';
import { PaginationRes } from '../utils/pagination.util';
import { ReqUser } from '../auth/request.initiator.decorator';
import { UserJwtPayload } from '../auth/user.jwt.type';

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
  async createConductor(
    @ReqUser() initiator: UserJwtPayload,
    @Body() conductorBody: ConductorBodyDto,
  ): Promise<Conductor> {
    const conductor = await this.conductorService.create(initiator, initiator.id, conductorBody);
    return conductor;
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin creates conductor' })
  @ApiResponse({ status: 200 })
  @UseGuards(JwtAuthGuard, RoleAccessCheck([RolesType.ADMIN]))
  @Post('admin')
  async adminCreateConductor(
    @Body() conductorBody: AdminCreateConductorBodyDto,
    @ReqUser() initiator: UserJwtPayload,
  ): Promise<Conductor> {
    const { operatorId, ...rest } = conductorBody;
    const conductor = await this.conductorService.create(initiator, operatorId, rest);
    return conductor;
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Operator updates its conductor' })
  @ApiResponse({ status: 200 })
  @UseGuards(JwtAuthGuard, RoleAccessCheck([RolesType.OPERATOR]))
  @Patch('/:id')
  async updateConductor(
    @Param('id') conductorId: string,
    @ReqUser() initiator: UserJwtPayload,
    @Body() conductorBody: ConductorBodyDto,
  ): Promise<Conductor> {
    return this.conductorService.update(initiator, initiator.id, conductorId, conductorBody);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Operator removes its conductor' })
  @ApiResponse({ status: 200 })
  @UseGuards(JwtAuthGuard, RoleAccessCheck([RolesType.OPERATOR]))
  @Delete('/:id')
  async delConductor(@Param('id') id: string, @ReqUser() initiator: UserJwtPayload): Promise<Conductor> {
    return this.conductorService.delete(initiator, initiator.id, id);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin or controller removes conductor' })
  @ApiResponse({ status: 200 })
  @UseGuards(JwtAuthGuard, RoleAccessCheck([RolesType.ADMIN, RolesType.CONTROLLER]))
  @Delete('/admin/:id')
  async adminDelConductor(@Param('id') id: string, @ReqUser() initiator: UserJwtPayload): Promise<Conductor> {
    return this.conductorService.adminDelete(initiator, id);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin or Controller gets conductors' })
  @ApiResponse({ status: 200, type: Conductor })
  @UseGuards(JwtAuthGuard, RoleAccessCheck([RolesType.ADMIN, RolesType.CONTROLLER]))
  @Get('/admin')
  async getConductors(@Query() query: GetConductorsByAdminDto): Promise<PaginationRes> {
    return this.conductorService.getOperatorsConductors(query);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Operator gets its conductors' })
  @ApiResponse({ status: 200, type: Conductor })
  @UseGuards(JwtAuthGuard, RoleAccessCheck([RolesType.OPERATOR]))
  @Get('/')
  async getFiles(@UserId() operator: string, @Query() queryDto: PaginationQueryDto): Promise<PaginationRes> {
    return this.conductorService.getOperatorsConductors({ operator, ...queryDto });
  }
}
