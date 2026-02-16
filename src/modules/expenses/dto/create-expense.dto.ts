import { IsNotEmpty, IsNumber, IsOptional, IsString, IsArray, ValidateNested, IsDateString, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateExpenseItemDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    descricao: string;

    @ApiProperty()
    @IsNumber()
    @IsNotEmpty()
    quantidade: number;

    @ApiProperty()
    @IsNumber()
    @IsNotEmpty()
    valor: number;
}

export class CreateExpenseDto {
    @ApiProperty()
    @IsString()
    @IsOptional()
    nomeEstabelecimento?: string;

    @ApiProperty()
    @IsDateString()
    @IsOptional()
    dataCompra?: string;

    @ApiProperty()
    @IsNumber()
    @IsNotEmpty()
    valorTotal: number;

    @ApiProperty()
    @IsNumber()
    @IsOptional()
    valorTotalSemDesconto?: number;

    @ApiProperty()
    @IsNumber()
    @IsOptional()
    valorDesconto?: number;

    @ApiProperty()
    @IsBoolean()
    @IsOptional()
    foiEditada?: boolean;

    @ApiProperty()
    @IsString()
    @IsOptional()
    urlQrcode?: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    xmlRaw?: string;

    @ApiProperty({ type: [CreateExpenseItemDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateExpenseItemDto)
    itens: CreateExpenseItemDto[];
}

export class ParseQrDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    url: string;
}
