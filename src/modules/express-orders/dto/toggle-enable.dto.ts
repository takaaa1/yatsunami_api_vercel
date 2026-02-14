import { IsBoolean } from 'class-validator';

export class ToggleEnableDto {
  @IsBoolean()
  habilitado: boolean;
}
