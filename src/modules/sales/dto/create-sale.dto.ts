import { IsNotEmpty, IsNumber, IsOptional, IsString, IsArray, ValidateNested, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum DiscountType {
    FIXED = 'fixed',
    PERCENTAGE = 'percentage',
}

export class CreateSaleItemDto {
    @ApiProperty()
    @IsNumber()
    @IsNotEmpty()
    produtoId: number;

    @ApiProperty()
    @IsOptional()
    @IsNumber()
    variedadeId?: number;

    @ApiProperty()
    @IsNumber()
    @IsNotEmpty()
    quantidade: number;

    @ApiProperty()
    @IsNumber()
    @IsNotEmpty()
    precoUnitario: number;

    @ApiProperty({ required: false, enum: DiscountType })
    @IsOptional()
    @IsEnum(DiscountType)
    tipoDesconto?: DiscountType;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    valorDesconto?: number;
}

export class CreateSaleDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    usuarioId?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    observacoes?: string;

    @ApiProperty({ type: [CreateSaleItemDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateSaleItemDto)
    itens: CreateSaleItemDto[];
}
