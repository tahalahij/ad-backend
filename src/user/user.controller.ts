import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesType } from '../auth/role.type';
import { CreateUserDto } from './dtos/create.user.dto';
import { User, UserDocument } from './user.schema';
import { UpdateUserDto } from './dtos/update.user.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserId } from '../auth/user.id.decorator';
import { RoleAccessCheck } from '../auth/role.access.guard';
import { OperatorUpdateOwnDto } from './dtos/operator.update.own.dto';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin gets all users' })
  @ApiResponse({ status: 200, type: User })
  @UseGuards(JwtAuthGuard, RoleAccessCheck([RolesType.ADMIN]))
  @Get('/admin/operators')
  async getOperators(): Promise<UserDocument[]> {
    return this.userService.getOperators();
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin creates a operator or controller' })
  @ApiResponse({ status: 200, type: User })
  @UseGuards(JwtAuthGuard, RoleAccessCheck([RolesType.ADMIN]))
  @Post('/admin')
  async addUser(@Body() body: CreateUserDto): Promise<User> {
    return this.userService.createNewUser(body);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin updates his info' })
  @ApiResponse({ status: 200, type: User })
  @UseGuards(JwtAuthGuard, RoleAccessCheck([RolesType.ADMIN]))
  @Patch('/admin')
  async adminUpdateHisPass(@UserId('id') adminId: string, @Body() body: UpdateUserDto): Promise<User> {
    return this.userService.updateUser(adminId, body);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Operator updates his info' })
  @ApiResponse({ status: 200, type: User })
  @UseGuards(JwtAuthGuard, RoleAccessCheck([RolesType.OPERATOR]))
  @Patch('/operator')
  async resetPassword(@UserId('id') operatorId: string, @Body() body: OperatorUpdateOwnDto): Promise<User> {
    return this.userService.updateUser(operatorId, body);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin updates a operator' })
  @ApiResponse({ status: 200, type: User })
  @UseGuards(JwtAuthGuard, RoleAccessCheck([RolesType.ADMIN]))
  @Patch('/admin/:id')
  async updateUser(@Param('id') id: string, @Body() body: UpdateUserDto): Promise<User> {
    return this.userService.updateUser(id, body);
  }
}
