import { IsString, IsOptional, IsBoolean, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UserFilterDto {
    @ApiPropertyOptional({ example: 'João', description: 'Busca por nome ou e-mail' })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ example: 'user', enum: ['admin', 'user'], description: 'Filtrar por role' })
    @IsOptional()
    @IsString()
    @IsIn(['admin', 'user'])
    role?: string;

    @ApiPropertyOptional({ example: true, description: 'Filtrar por status ativo/inativo' })
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value;
    })
    ativo?: boolean;
}
