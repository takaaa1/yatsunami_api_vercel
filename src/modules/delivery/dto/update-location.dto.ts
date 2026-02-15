import { IsNumber } from 'class-validator';

export class UpdateLocationDto {
    @IsNumber()
    formId: number;

    @IsNumber()
    latitude: number;

    @IsNumber()
    longitude: number;
}
