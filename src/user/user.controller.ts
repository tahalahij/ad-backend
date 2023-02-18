import { Body, Controller, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesType } from '../auth/role.type';
import { CreateUserDto } from './dtos/create.user.dto';
import { User } from './user.schema';
import { UpdateUserDto } from './dtos/update.user.dto';
@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  // for test
  @Post('/seed')
  async seed(): Promise<void> {
    return this.userService.seed();
  }

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

  @UseGuards(JwtAuthGuard)
  @Patch('/:id')
  async updateUser(@Param('id') id: string, @Body() body: UpdateUserDto): Promise<User> {
    return this.userService.updateUser(id, body);
  }
}
