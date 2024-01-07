import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Head,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  Response,
  UseInterceptors,
  Delete,
  UploadedFiles,
} from '@nestjs/common';
import { FileService } from './file.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserId } from '../auth/user.id.decorator';
import { File } from './file.schema';
import mongoose from 'mongoose';
import express from 'express';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UploadDto } from './dtos/upload.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RoleAccessCheck } from '../auth/role.access.guard';
import { RolesType } from '../auth/role.type';
import { IpAccessCheckGuard } from '../auth/ip.access.guard';
import { PaginationQueryDto } from '../schedule/dtos/pagination.dto';
import { GetFilesByAdminDto } from './dtos/get-files-by-admin.dto';
import { PaginationRes } from '../utils/pagination.util';
import { ReqUser } from '../auth/request.initiator.decorator';
import { UserJwtPayload } from '../auth/user.jwt.type';
import { persianStringJoin } from '../utils/helper';
import { PanelFileNameParamDto } from './dtos/panel.file.name.param.dto';
import { UploadLimitGuard } from './guards/upload.limit.guard';

function fileFilter(req, file, callback) {
  const extension = extname(file.originalname);
  const acceptedFormats = ['.png', '.jpg', '.jpeg', '.mp3', '.mp4'];
  if (!acceptedFormats.includes(extension)) {
    return callback(
      new Error(persianStringJoin(['فقط فایلها با فرمت های', acceptedFormats.join(), ' قابل اپلود هستند'])),
      false,
    );
  }
  callback(null, true);
}
function editFileName(req, file, callback) {
  file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
  const name = file.originalname.split('.')[0];
  const userId = req.user.id;
  const extension = extname(file.originalname);
  const newName = `${new Date().getTime()}-${name}-${userId}${extension}`;
  console.log({ newName });

  callback(null, newName);
}

function editFileNameForAdmin(req, file, callback) {
  file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
  const name = file.originalname.split('.')[0];
  const userId = req.params.operatorId;
  const extension = extname(file.originalname);
  const newName = `${new Date().getTime()}-${name}-${userId}${extension}`;
  console.log({ newName });

  callback(null, newName);
}

function adminPanelfileUpload(req, file, callback) {
  const extension = extname(file.originalname);
  const newName = `${req.params.fileName.toLowerCase()}_default${extension}`;

  callback(null, newName);
}

const rootDir = '../samand';
@ApiTags('files')
@Controller('files')
export class FileController {
  constructor(private fileService: FileService) {}
  private logger = new Logger(FileController.name);

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Operator upload its file' })
  @ApiResponse({ status: 200 })
  @UseGuards(JwtAuthGuard, RoleAccessCheck([RolesType.OPERATOR]), UploadLimitGuard)
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: rootDir + '/files',
        filename: editFileName,
      }),
      fileFilter,
    }),
  )
  async uploadByOperator(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadBody: UploadDto,
    @ReqUser() initiator: UserJwtPayload,
  ) {
    this.logger.log('upload file:', { file, operatorId: initiator.id, uploadBody });
    const createdFile = await this.fileService.createFile(initiator, initiator.id, file, uploadBody);
    return { fileName: file.filename, id: createdFile._id };
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin uploads xlsx files for azan' })
  @ApiResponse({ status: 200 })
  @UseGuards(JwtAuthGuard, RoleAccessCheck([RolesType.ADMIN]))
  @Post('admin/azan-time-xlsx')
  @UseInterceptors(
    FilesInterceptor('file', 10, {
      storage: diskStorage({
        destination: rootDir + '/temp',
        filename: function editFileName(req, file, callback) {
          callback(null, file.originalname);
        },
      }),
      fileFilter(req, file, callback) {
        const extension = extname(file.originalname);
        const acceptedFormats = ['.png', '.jpg', '.jpeg', '.mp3', '.mp4'];
        if (extension !== '.csv') {
          return callback(new Error(persianStringJoin(['فقط فای با فرمت ', 'csv', ' قابل اپلود هست'])), false);
        }
        callback(null, true);
      },
    }),
  )
  async uploadAzanXlsx(
    @UploadedFiles()
    files: // new ParseFilePipe({ validators: [new FileTypeValidator({ fileType: 'csv' })] })
    Array<Express.Multer.File>,
    @ReqUser() initiator: UserJwtPayload,
  ) {
    await this.fileService.uploadAzanXlsx(initiator, files);
    return { message: 'فایل ها با موفقیت اضافه شدند' };
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin uploads azan file' })
  @ApiResponse({ status: 200 })
  @UseGuards(JwtAuthGuard, RoleAccessCheck([RolesType.ADMIN]))
  @Post('admin/azan-file')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: rootDir + '/files/azan',
        filename: function editFileName(req, file, callback) {
          callback(null, file.originalname);
        },
      }),
      fileFilter,
    }),
  )
  async uploadAzanFile(@UploadedFile() file: Express.Multer.File, @ReqUser() initiator: UserJwtPayload) {
    this.logger.log('upload file:', { file });
    await this.fileService.uploadAzanFile(initiator, file);
    return { message: 'فایل اذان با موفقیت اپدیت شد' };
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Operator delete its file by id' })
  @ApiResponse({ status: 200 })
  @UseGuards(JwtAuthGuard, RoleAccessCheck([RolesType.OPERATOR]))
  @Delete('/:fileId')
  async delete(@Param('fileId') fileId: string, @ReqUser() initiator: UserJwtPayload) {
    return this.fileService.deleteFile(initiator, fileId);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin and controller delete file by id' })
  @ApiResponse({ status: 200 })
  @UseGuards(JwtAuthGuard, RoleAccessCheck([RolesType.ADMIN, RolesType.CONTROLLER]))
  @Delete('admin/:fileId')
  async adminDeleteFile(@Param('fileId') fileId: string, @ReqUser() initiator: UserJwtPayload) {
    return this.fileService.adminDeleteFile(initiator, fileId);
  }

  @ApiOperation({ summary: 'return the type of azan file in the Content-Type header' })
  @Head('download/azan')
  getAzanType(@Response() res: express.Response): express.Response {
    const type = this.fileService.getAzanType();
    console.log({
      azanType: type,
    });
    res.set({ 'Content-Type': type });
    return res.end();
  }

  @Get('download/azan')
  downloadAzan(): StreamableFile {
    return this.fileService.downloadAzan();
  }

  @Get('download/:fileName')
  @UseGuards(IpAccessCheckGuard)
  download(@Param('fileName') fileName: string) {
    return this.fileService.fileBuffer(fileName);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin upload panel file' })
  @ApiResponse({ status: 200 })
  @UseGuards(JwtAuthGuard, RoleAccessCheck([RolesType.ADMIN]))
  @Post('admin/panel-file/upload/:fileName')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './public',
        filename: adminPanelfileUpload,
      }),
      fileFilter,
    }),
  )
  async adminUploadPanelFile(@Param() { fileName }: PanelFileNameParamDto, @UploadedFile() file: Express.Multer.File) {
    return { message: 'فایل با موفقیت آپلود شد' };
  }

  @ApiOperation({ summary: 'returns a stream of panel file' })
  @Get('panel-files/:fileName')
  downloadPanelFile(@Param() { fileName }: PanelFileNameParamDto) {
    return this.fileService.downloadPanelFile(fileName);
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

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Operator gets its files' })
  @ApiResponse({ status: 200, type: File })
  @UseGuards(JwtAuthGuard, RoleAccessCheck([RolesType.OPERATOR]))
  @Get('operator/')
  async getFiles(
    @UserId() operatorId: mongoose.Types.ObjectId,
    @Query() queryDto: PaginationQueryDto,
  ): Promise<PaginationRes> {
    return this.fileService.getFiles(operatorId, queryDto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin or controller gets files' })
  @ApiResponse({ status: 200, type: File })
  @UseGuards(JwtAuthGuard, RoleAccessCheck([RolesType.ADMIN, RolesType.CONTROLLER]))
  @Get('/')
  async adminGetFiles(@Query() queryDto: GetFilesByAdminDto): Promise<PaginationRes> {
    return this.fileService.getFilesByAdmin(queryDto);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'admin upload file on behalf of operator' })
  @ApiResponse({ status: 200 })
  @UseGuards(JwtAuthGuard, RoleAccessCheck([RolesType.ADMIN]))
  @Post('admin/:operatorId/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: rootDir + '/files',
        filename: editFileNameForAdmin,
      }),
      fileFilter,
    }),
  )
  async uploadByAdmin(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadBody: UploadDto,
    @Param('operatorId') operatorId: string,
    @ReqUser() initiator: UserJwtPayload,
  ) {
    this.logger.log('upload file:', { file, operatorId, uploadBody });
    const createdFile = await this.fileService.createFile(initiator, operatorId, file, uploadBody);
    return { fileName: file.filename, id: createdFile._id };
  }
}
