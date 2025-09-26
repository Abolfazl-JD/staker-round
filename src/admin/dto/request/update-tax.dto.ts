import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateTaxDto {
  @IsString()
  @IsNotEmpty()
  taxPercent: string;
}
