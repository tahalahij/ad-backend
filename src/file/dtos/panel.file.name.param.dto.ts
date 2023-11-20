import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { PanelFilesNameEnum } from '../enums/panel.files.name.enum';

export class PanelFileNameParamDto {
  @ApiProperty({ example: PanelFilesNameEnum.DASHBOARD, description: 'name of the panel file' })
  @IsNotEmpty()
  @IsEnum(PanelFilesNameEnum)
  fileName: PanelFilesNameEnum;
}
