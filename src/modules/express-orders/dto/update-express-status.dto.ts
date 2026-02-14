import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateExpressStatusDto {
  @IsEnum(['pendente', 'confirmado', 'entregue', 'cancelado'])
  status: string;

  @IsOptional()
  @IsString()
  observacoes?: string;
}
