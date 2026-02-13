import { IsString, IsOptional, IsEnum, IsNumber, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export enum TipoChavePix {
    CPF = 'cpf',
    CNPJ = 'cnpj',
    EMAIL = 'email',
    PHONE = 'phone',
    EVP = 'evp',
}

export class UpdateConfiguracaoDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    chavePix?: string;

    @ApiProperty({ required: false, enum: TipoChavePix })
    @IsOptional()
    @IsEnum(TipoChavePix)
    tipoChavePix?: TipoChavePix;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    @MaxLength(25)
    nomeRecebedor?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    @MaxLength(15)
    cidadeRecebedor?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    taxaEntregaBase?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    valorMinimoTaxaReduzida?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    taxaEntregaReduzida?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    valorMinimoIsencao?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @Transform(({ value }) => {
        if (typeof value === 'string') {
            try {
                return JSON.parse(value);
            } catch {
                return value;
            }
        }
        return value;
    })
    enderecosEspeciais?: any;
}
