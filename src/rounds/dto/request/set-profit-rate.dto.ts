import { IsNotEmpty, IsNumberString } from 'class-validator';

export class SetProfitRateDto {
  @IsNumberString()
  @IsNotEmpty()
  profitRatePencent: string;
}
