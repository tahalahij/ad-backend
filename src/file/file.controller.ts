import { Controller, Get, Param, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileService } from './file.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserId } from '../auth/user.id.decorator';
import { File } from './file.schema';
import { PaginationQueryDto } from './dtos/pagination.dto';
import mongoose from 'mongoose';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { AccessCheck } from '../auth/access.guard';
import { extname } from 'path';
import { RealIP } from 'nestjs-real-ip';

function editFileName(req, file, callback) {
  const name = file.originalname.split('.')[0];
  const extension = extname(file.originalname);
  const newName = `${new Date().getTime()}-${name}${extension}`;
  console.log({ newName });

  callback(null, newName);
}

@Controller('files')
export class FileController {
  constructor(private fileService: FileService) {}

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
  async upload(@UploadedFile() file: Express.Multer.File, @RealIP() ip: string, @UserId() adminId: string) {
    console.log('###', { file, ip, adminId });
    await this.fileService.createFile(adminId, file.path);
    return { fileName: file.filename };
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
}
