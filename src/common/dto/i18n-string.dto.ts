import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class I18nStringDto {
    @ApiProperty({ example: 'Nome em Português' })
    @IsString()
    @IsNotEmpty()
    'pt-BR': string;

    @ApiProperty({ example: 'Name in Japanese' })
    @IsString()
    @IsNotEmpty()
    'ja-JP': string;
}
