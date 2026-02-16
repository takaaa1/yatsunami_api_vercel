import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateLocationDto {
    @IsNumber()
    formId: number;

    @IsNumber()
    latitude: number;

    @IsNumber()
    longitude: number;

    @IsOptional()
    @IsNumber()
    courierId?: number;

    @IsOptional()
    @IsString()
    userId?: string;
}
