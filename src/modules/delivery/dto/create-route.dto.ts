import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class CreateRouteDestinationDto {
  @IsString()
  address: string;

  @IsOptional()
  @IsString()
  fullAddress?: string;

  @IsOptional()
  @IsString()
  cep?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsString()
  name: string;

  @IsOptional()
  @IsInt()
  orderId?: number;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  orderIds?: number[];

  /**
   * Tempo de serviço na parada após chegada (segundos).
   * Enviado pelo cliente: 300 por defeito; pontos especiais = 300 × número de encomendas no ponto.
   */
  @IsOptional()
  @IsInt()
  serviceStopSeconds?: number;

  @IsOptional()
  @IsString()
  routeDepartureTime?: string;
}

export class CreateRouteDto {
  @IsNumber()
  formId: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRouteDestinationDto)
  destinations: CreateRouteDestinationDto[];

  @IsOptional()
  @IsString()
  origin?: string;

  @IsOptional()
  @IsString()
  departureTime?: string;

  @IsOptional()
  @IsNumber()
  couriers?: number;

  @IsOptional()
  @IsBoolean()
  includeSpecialAddresses?: boolean;
}
