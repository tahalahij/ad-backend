import { Controller, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { ApiTags } from '@nestjs/swagger';
@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  // for test
  @Post('/seed')
  async seed(): Promise<void> {
    return this.userService.seed();
  }
}
