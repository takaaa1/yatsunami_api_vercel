import { IsArray, IsDateString, IsInt, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class CreateExpressOrderItemDto {
  @IsInt()
  produtoId: number;

  @IsOptional()
  @IsInt()
  variedadeId?: number;

  @IsInt()
  quantidade: number;
}

export class CreateExpressOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateExpressOrderItemDto)
  itens: CreateExpressOrderItemDto[];

  @IsOptional()
  @IsString()
  observacoes?: string;

  @IsOptional()
  @IsDateString()
  dataEntrega?: string;
}
