import { IsArray, IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateRouteDto {
  @IsNumber()
  formId: number;

  @IsArray()
  destinations: { address: string; name: string; orderId?: number }[]; // Objects with address and name

  @IsOptional()
  @IsString()
  origin?: string; // Optional starting point, otherwise use company address

  @IsOptional()
  @IsString()
  departureTime?: string; // ISO string for departure time

  @IsOptional()
  @IsNumber()
  couriers?: number;

  @IsOptional()
  @IsBoolean()
  includeSpecialAddresses?: boolean;
}
