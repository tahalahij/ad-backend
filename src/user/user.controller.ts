import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { UserService } from './user.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesType } from '../auth/role.type';
import { CreateUserDto } from './dtos/create.user.dto';
import { User } from './user.schema';
import { UpdateUserDto } from './dtos/update.user.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserId } from '../auth/user.id.decorator';
import { RoleAccessCheck } from '../auth/role.access.guard';
import { OperatorUpdateOwnDto } from './dtos/operator.update.own.dto';
import { PaginationRes } from '../utils/pagination.util';
import { StripperPasswordFromUserInterceptor } from './interceptors/stripper.password.from.user.interceptor';
import { ReqUser } from '../auth/request.initiator.decorator';
import { UserJwtPayload } from '../auth/user.jwt.type';
import { GetUsersQueryDto } from './dtos/get.users.query.dto';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'All users can get their info' })
  @ApiResponse({ status: 200 })
  @UseGuards(JwtAuthGuard, RoleAccessCheck([RolesType.ADMIN, RolesType.CONTROLLER, RolesType.OPERATOR]))
  @Get('/whoami')
  async whoAmI(@ReqUser() initiator: UserJwtPayload): Promise<User> {
    return this.userService.getOperator(initiator.id);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin or controller gets all users' })
  @ApiResponse({ status: 200, type: User })
  @UseGuards(JwtAuthGuard, RoleAccessCheck([RolesType.ADMIN, RolesType.CONTROLLER]))
  @UseInterceptors(StripperPasswordFromUserInterceptor)
  @Get('/admin/operators')
  async getOperators(@Query() query: GetUsersQueryDto): Promise<PaginationRes> {
    return this.userService.getOperators(query);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin or controller gets operator info' })
  @ApiResponse({ status: 200, type: User })
  @UseGuards(JwtAuthGuard, RoleAccessCheck([RolesType.ADMIN, RolesType.CONTROLLER]))
  @UseInterceptors(StripperPasswordFromUserInterceptor)
  @Get('/admin/operators/:id')
  async getOperator(@Param('id') id: string): Promise<User> {
    return this.userService.getOperator(id);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin gets all controllers' })
  @ApiResponse({ status: 200, type: User })
  @UseGuards(JwtAuthGuard, RoleAccessCheck([RolesType.ADMIN]))
  @UseInterceptors(StripperPasswordFromUserInterceptor)
  @Get('/admin/controllers')
  async getControllers(@Query() query: GetUsersQueryDto): Promise<PaginationRes> {
    return this.userService.getControllers(query);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin creates a operator or controller' })
  @ApiResponse({ status: 200, type: User })
  @UseGuards(JwtAuthGuard, RoleAccessCheck([RolesType.ADMIN]))
  @UseInterceptors(StripperPasswordFromUserInterceptor)
  @Post('/admin')
  async addUser(@Body() body: CreateUserDto, @ReqUser() initiator: UserJwtPayload): Promise<User> {
    return this.userService.createNewUser(initiator, body);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin updates his info' })
  @ApiResponse({ status: 200, type: User })
  @UseGuards(JwtAuthGuard, RoleAccessCheck([RolesType.ADMIN]))
  @UseInterceptors(StripperPasswordFromUserInterceptor)
  @Patch('/admin')
  async adminUpdateHisPass(@ReqUser() initiator: UserJwtPayload, @Body() body: UpdateUserDto): Promise<User> {
    return this.userService.updateUser(initiator, initiator.id, body);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Operator updates his info' })
  @ApiResponse({ status: 200, type: User })
  @UseGuards(JwtAuthGuard, RoleAccessCheck([RolesType.OPERATOR]))
  @UseInterceptors(StripperPasswordFromUserInterceptor)
  @Patch('/operator')
  async resetPassword(
    @UserId('id') operatorId: string,
    @Body() body: OperatorUpdateOwnDto,
    @ReqUser() initiator: UserJwtPayload,
  ): Promise<User> {
    return this.userService.updateUser(initiator, operatorId, body);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin updates a operator or controller' })
  @ApiResponse({ status: 200, type: User })
  @UseGuards(JwtAuthGuard, RoleAccessCheck([RolesType.ADMIN]))
  @UseInterceptors(StripperPasswordFromUserInterceptor)
  @Patch('/admin/:id')
  async updateUser(
    @Param('id') id: string,
    @Body() body: UpdateUserDto,
    @ReqUser() initiator: UserJwtPayload,
  ): Promise<User> {
    return this.userService.updateUser(initiator, id, body);
  }
}
