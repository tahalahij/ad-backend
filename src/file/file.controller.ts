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
import { IpAccessCheck } from '../auth/ip.access.guard';
import { extname } from 'path';
import { UploadDto } from './dtos/upload.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RoleAccessCheck } from '../auth/role.access.guard';
import { RolesType } from '../auth/role.type';

function editFileName(req, file, callback) {
  const name = file.originalname.split('.')[0];
  const userId = req.user.id;
  const extension = extname(file.originalname);
  const newName = `${new Date().getTime()}-${name}-${userId}${extension}`;
  console.log({ newName });

  callback(null, newName);
}
@ApiTags('files')
@Controller('files')
export class FileController {
  constructor(private fileService: FileService) {}
  private logger = new Logger(FileController.name);

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

  @Get('download/:fileName')
  @IpAccessCheck()
  download(@Param('fileName') fileName: string) {
    return this.fileService.fileBuffer(fileName);
  }

  @Get('download/stream/:fileName')
  @IpAccessCheck()
  async stream(
    @Res({ passthrough: true }) res: Response,
    @Param('fileName') fileName: string,
  ): Promise<StreamableFile> {
    return this.fileService.fileStream(fileName);
  }
}
