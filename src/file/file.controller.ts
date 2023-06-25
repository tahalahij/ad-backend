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
  Delete,
} from '@nestjs/common';
import { FileService } from './file.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserId } from '../auth/user.id.decorator';
import { File } from './file.schema';
import mongoose from 'mongoose';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UploadDto } from './dtos/upload.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RoleAccessCheck } from '../auth/role.access.guard';
import { RolesType } from '../auth/role.type';
import { IpAccessCheckGuard } from '../auth/ip.access.guard';
import { PaginationQueryDto } from '../schedule/dtos/pagination.dto';

function editFileName(req, file, callback) {
  const name = file.originalname.split('.')[0];
  const userId = req.user.id;
  const extension = extname(file.originalname);
  const newName = `${new Date().getTime()}-${name}-${userId}${extension}`;
  console.log({ newName });

  callback(null, newName);
}

function adminDashboardPic(req, file, callback) {
  const extension = extname(file.originalname);
  const newName = `dashboard${extension}`;

  callback(null, newName);
}
@ApiTags('files')
@Controller('files')
export class FileController {
  constructor(private fileService: FileService) {}
  private logger = new Logger(FileController.name);

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin gets files' })
  @ApiResponse({ status: 200, type: File })
  @UseGuards(JwtAuthGuard, RoleAccessCheck([RolesType.ADMIN]))
  @Get('/')
  async adminGetFiles(
    @UserId() operatorId: mongoose.Types.ObjectId,
    @Query() queryDto: PaginationQueryDto,
  ): Promise<File[]> {
    return this.fileService.getFiles(operatorId, queryDto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Operator gets its files' })
  @ApiResponse({ status: 200, type: File })
  @UseGuards(JwtAuthGuard, RoleAccessCheck([RolesType.OPERATOR]))
  @Get('/')
  async getFiles(
    @UserId() operatorId: mongoose.Types.ObjectId,
    @Query() queryDto: PaginationQueryDto,
  ): Promise<File[]> {
    return this.fileService.getFiles(operatorId, queryDto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Operator upload its file' })
  @ApiResponse({ status: 200 })
  @UseGuards(JwtAuthGuard, RoleAccessCheck([RolesType.OPERATOR]))
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

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Operator delete its file by id' })
  @ApiResponse({ status: 200 })
  @UseGuards(JwtAuthGuard, RoleAccessCheck([RolesType.OPERATOR]))
  @Delete('/:fileId')
  async delete(@Param('fileId') fileId: string, @UserId() adminId: string) {
    return this.fileService.deleteFile(adminId, fileId);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin upload dashboard pic ' })
  @ApiResponse({ status: 200 })
  @UseGuards(JwtAuthGuard, RoleAccessCheck([RolesType.ADMIN]))
  @Post('admin/dashboard/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './public',
        filename: adminDashboardPic,
      }),
    }),
  )
  async adminUploadDashboardPic(@UploadedFile() file: Express.Multer.File, @UserId() adminId: string) {
    return 'uploaded';
  }

  @Get('download/:fileName')
  @UseGuards(IpAccessCheckGuard)
  download(@Param('fileName') fileName: string) {
    return this.fileService.fileBuffer(fileName);
  }

  @ApiOperation({ summary: 'returns a stream of dashboard pic ' })
  @Get('dashboard')
  dashboard() {
    return this.fileService.dashboard();
  }

  @Get('download/stream/:fileName')
  @UseGuards(IpAccessCheckGuard)
  async stream(
    @Res({ passthrough: true }) res: Response,
    @Param('fileName') fileName: string,
  ): Promise<StreamableFile> {
    return this.fileService.fileStream(fileName);
  }

  @Get('admin/download/stream/:fileName')
  async streamForAdmin(
    @Res({ passthrough: true }) res: Response,
    @Param('fileName') fileName: string,
    @Query('auth_token') token: string,
  ): Promise<StreamableFile> {
    console.log({
      token,
    });
    return this.fileService.fileStream(fileName);
  }

  @Get('controller/download/stream/:fileName')
  async streamForController(
    @Res({ passthrough: true }) res: Response,
    @Param('fileName') fileName: string,
    @Query('auth_token') token: string,
  ): Promise<StreamableFile> {
    console.log({
      token,
    });
    return this.fileService.fileStream(fileName);
  }
}
