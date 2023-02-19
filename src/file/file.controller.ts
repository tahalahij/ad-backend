import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  Response,
  UseInterceptors,
} from '@nestjs/common';
import { FileService } from './file.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserId } from '../auth/user.id.decorator';
import { File } from './file.schema';
import { PaginationQueryDto } from './dtos/pagination.dto';
import mongoose from 'mongoose';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { AccessCheck } from '../auth/access.guard';
import { extname, join } from 'path';
import { RealIP } from 'nestjs-real-ip';
import { UploadDto } from './dtos/upload.dto';
import { createReadStream } from 'fs';
import { ScheduleBodyDto } from './dtos/schedule.body.dto';
import { UserService } from '../user/user.service';
import { Schedule } from './schedule.schema';

function editFileName(req, file, callback) {
  const name = file.originalname.split('.')[0];
  const extension = extname(file.originalname);
  const newName = `${new Date().getTime()}-${name}${extension}`;
  console.log({ newName });

  callback(null, newName);
}

@Controller('files')
export class FileController {
  constructor(private fileService: FileService, private userService: UserService) {}
  private logger = new Logger(FileController.name);

  @UseGuards(JwtAuthGuard)
  @Get('/')
  async getFiles(
    @UserId() userId: mongoose.Types.ObjectId,
    @Query() queryDto: PaginationQueryDto,
    @RealIP() ip: string,
  ): Promise<File[]> {
    return this.fileService.getFiles(userId, queryDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './files',
        filename: editFileName,
      }),
    }),
  )
  async upload(@UploadedFile() file: Express.Multer.File, @Body() uploadBody: UploadDto, @UserId() adminId: string) {
    this.logger.log('upload file:', { file, adminId, uploadBody });
    const createdFile = await this.fileService.createFile(adminId, file, uploadBody);
    return { fileName: file.filename, id: createdFile._id };
  }

  @Get('download/:fileName')
  @AccessCheck()
  download(@Param('fileName') fileName: string) {
    const file = this.fileService.fileBuffer(fileName);
    return file;
  }

  @Get('download/stream/:fileName')
  @AccessCheck()
  stream(@Param('fileName') fileName: string) {
    const file = this.fileService.fileBuffer(fileName);
    return file;
  }

  @UseGuards(JwtAuthGuard)
  @Post('schedule')
  async upsertSchedule(@UserId() adminId: string, @Body() scheduleBody: ScheduleBodyDto): Promise<Schedule> {
    const user = await this.userService.findByIp(adminId);
    const schedule = await this.fileService.upsertSchedule(user.ip, scheduleBody);
    return schedule;
  }

  async getSchedule(@Res({ passthrough: true }) res: Response, @RealIP() ip: string): Promise<StreamableFile> {
    const file = await this.fileService.getSchedule(ip);
    const stream = createReadStream(join(process.cwd(), file.path));
    return new StreamableFile(stream);
  }
}
