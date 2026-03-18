import { IsArray, IsNumber } from 'class-validator';

export class ReorderStopsDto {
  @IsArray()
  nomesParadas: (
    | string
    | {
        address: string;
        name?: string;
        fullAddress?: string;
        orderId?: number;
        orderIds?: number[];
        courierId?: number;
        latitude?: number;
        longitude?: number;
        arrivalTime?: string;
      }
  )[];
}
