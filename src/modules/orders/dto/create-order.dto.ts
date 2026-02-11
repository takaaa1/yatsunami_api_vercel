import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsArray, ValidateNested, IsNotEmpty, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderItemDto } from './order-item.dto';

export class CreateOrderDto {
    @ApiProperty({ example: 1, description: 'ID da data de encomenda' })
    @IsNotEmpty()
    @IsNumber()
    dataEncomendaId: number;

    @ApiProperty({ example: 2, description: 'Quantidade de talheres', default: 0 })
    @IsNumber()
    @Min(0)
    talheres: number = 0;

    @ApiProperty({ example: 'Sem cebola', description: 'Observações do pedido', required: false })
    @IsOptional()
    @IsString()
    observacoes?: string;

    @ApiProperty({ example: 'pix', description: 'Forma de pagamento', required: false })
    @IsOptional()
    @IsString()
    formaPagamento?: string;

    @ApiProperty({ example: 'entrega', description: 'Tipo de entrega', required: false })
    @IsOptional()
    @IsString()
    tipoEntrega?: string;

    @ApiProperty({ example: 10.00, description: 'Taxa de entrega', default: 0 })
    @IsNumber()
    @Min(0)
    taxaEntrega: number = 0;

    @ApiProperty({ type: [OrderItemDto], description: 'Itens do pedido' })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => OrderItemDto)
    itens: OrderItemDto[];
}
