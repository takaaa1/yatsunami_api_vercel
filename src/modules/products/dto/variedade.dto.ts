import { IsNumber, IsOptional, IsBoolean, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { I18nStringDto } from '../../../common/dto/i18n-string.dto';

export class CreateVariedadeDto {
    @ApiProperty({ type: I18nStringDto })
    @ValidateNested()
    @Type(() => I18nStringDto)
    nome: I18nStringDto;

    @ApiProperty({ example: 10.00 })
    @IsNumber()
    @Min(0)
    preco: number;

    @ApiProperty({ default: true, required: false })
    @IsOptional()
    @IsBoolean()
    ativo?: boolean;
}

export class UpdateVariedadeDto extends CreateVariedadeDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    id?: number;
}
