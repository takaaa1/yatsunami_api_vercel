import { IsBoolean, IsDateString, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderFormDto {
    @ApiProperty({ description: 'Data da entrega (YYYY-MM-DD)', example: '2024-12-25' })
    @IsDateString()
    data_entrega: string;

    @ApiProperty({ description: 'Prazo limite para pedidos (ISO String)', example: '2024-12-24T23:59:00Z' })
    @IsDateString()
    data_limite_pedido: string;

    @ApiProperty({ description: 'Indica se o formulário está ativo', default: true })
    @IsBoolean()
    @IsOptional()
    ativo?: boolean;

    @ApiProperty({ description: 'Indica se a entrega foi concluída', default: false })
    @IsBoolean()
    @IsOptional()
    concluido?: boolean;

    @ApiProperty({ description: 'Observações internas', required: false })
    @IsString()
    @IsOptional()
    observacoes?: string;
}
