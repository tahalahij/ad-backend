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
  Header,
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
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

function editFileName(req, file, callback) {
  const name = file.originalname.split('.')[0];
  const extension = extname(file.originalname);
  const newName = `${new Date().getTime()}-${name}${extension}`;
  console.log({ newName });

  callback(null, newName);
}
@ApiTags('files')
@Controller('files')
export class FileController {
  constructor(private fileService: FileService, private userService: UserService) {}
  private logger = new Logger(FileController.name);

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Operator gets its files' })
  @ApiResponse({ status: 200, type: File })
  @UseGuards(JwtAuthGuard)
  @Get('/')
  async getFiles(
    @UserId() userId: mongoose.Types.ObjectId,
    @Query() queryDto: PaginationQueryDto,
    @RealIP() ip: string,
  ): Promise<File[]> {
    return this.fileService.getFiles(userId, queryDto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Operator upload its file' })
  @ApiResponse({ status: 200 })
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
    return this.fileService.fileBuffer(fileName);
  }

  @Get('/:fileName')
  // @Header('Content-Type', 'application/json')
  // @Header('Content-Disposition', 'attachment; filename="package.json"')
  get(@Param('fileName') fileName: string, @Res() res: Response) {
    const file = createReadStream(join(process.cwd(), 'files', fileName));
    // @ts-ignore
    file.pipe(res);
    // return new StreamableFile(file);
  }

  @Get('/buffer/:fileName')
  @AccessCheck()
  stream(@Param('fileName') fileName: string) {
    const file = this.fileService.fileBuffer(fileName);
    return file;
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Operator updates or creates its schedule' })
  @ApiResponse({ status: 200 })
  @UseGuards(JwtAuthGuard)
  @Post('schedule')
  async upsertSchedule(@UserId() adminId: string, @Body() scheduleBody: ScheduleBodyDto): Promise<Schedule> {
    const schedule = await this.fileService.upsertSchedule(adminId, scheduleBody);
    return schedule;
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Operators schedules' })
  @ApiResponse({ status: 200 })
  @UseGuards(JwtAuthGuard)
  @Get('schedule/operators')
  async getOperatorsSchedules(@UserId() adminId: string): Promise<Schedule[]> {
    return this.fileService.getOperatorsSchedules(adminId);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'App gets file it supposed to show now' })
  @ApiResponse({ status: 200 })
  @Get('schedule')
  async getSchedule(@Res({ passthrough: true }) res: Response, @RealIP() ip: string): Promise<File> {
    return this.fileService.getSchedule(ip);
    // const stream = createReadStream(join(process.cwd(), file.path));
    // return new StreamableFile(stream);
  }
}
