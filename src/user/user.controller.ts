import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesType } from '../auth/role.type';
import { CreateUserDto } from './dtos/create.user.dto';
import { User, UserDocument } from './user.schema';
import { UpdateUserDto } from './dtos/update.user.dto';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  // for test
  @Post('/seed')
  async seed(): Promise<void> {
    return this.userService.seed();
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin gets all users' })
  @ApiResponse({ status: 200, type: User })
  @UseGuards(JwtAuthGuard)
  @Get('/operators')
  async getOperator(): Promise<UserDocument[]> {
    return this.userService.getOperator();
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin creates a operator' })
  @ApiResponse({ status: 200, type: User })
  @UseGuards(JwtAuthGuard)
  @Post('/')
  async addUser(@Body() body: CreateUserDto): Promise<User> {
    return this.userService.createNewUser({
      name: body.name,
      ip: body.ip,
      role: RolesType.OPERATOR,
      username: body.username,
      password: body.password,
    });
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin updates a operator' })
  @ApiResponse({ status: 200, type: User })
  @UseGuards(JwtAuthGuard)
  @Patch('/:id')
  async updateUser(@Param('id') id: string, @Body() body: UpdateUserDto): Promise<User> {
    return this.userService.updateUser(id, body);
  }
}
