import { Controller, Get, Param, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { RecordService } from './record.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminId } from '../auth/user.id.decorator';
import { Record } from './record.schema';
import { PaginationQueryDto } from './dtos/pagination.dto';
import mongoose from 'mongoose';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { AccessCheck } from '../auth/access.guard';
import { extname } from 'path';
function editFileName(req, file, callback) {
  console.log({ file, req });

  const name = file.originalName.split('.')[0];
  const extension = extname(file.originalName);
  const ip = req.ip;
  console.log(`${name}-${ip}${extension}`);

  callback(null, `${name}-${ip}${extension}`);
}

@Controller('records')
export class RecordController {
  constructor(private recordService: RecordService) {}

  @UseGuards(JwtAuthGuard)
  @Get('/records')
  async getRecords(
    @AdminId() userId: mongoose.Types.ObjectId,
    @Query() queryDto: PaginationQueryDto,
  ): Promise<Record[]> {
    return this.recordService.getRecords(userId, queryDto);
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './files',
        filename: editFileName,
      }),
    }),
  )
  async upload(@UploadedFile() file) {
    const response = {
      originalName: file.originalName,
      filename: file.filename,
    };
    return response;
  }

  @Get('download/:fileName')
  @AccessCheck()
  download(@Param('fileName') fileName: string) {
    const file = this.recordService.fileBuffer(fileName);
    return file;
  }
}
