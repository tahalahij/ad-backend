import { Controller, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { ApiTags } from '@nestjs/swagger';
import { User } from './user.schema';
@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Post('/seed')
  async seed(): Promise<User[]> {
    return this.userService.seed();
  }
}
