import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class UserLoginDto {
    @ApiProperty({ example: "jackdorsi" })
    @IsString()
    @IsNotEmpty()
    username: string;

    @ApiProperty({ example: "thi$ i$ jacks pa33" })
    @IsString()
    @IsNotEmpty()
    password: string;
}
