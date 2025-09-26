import { IsEnum, IsNumberString } from 'class-validator';

export class CreateTransactionDto {
  /**
   * @example "DEPOSIT"
   **/
  @IsEnum(['DEPOSIT', 'WITHDRAWAL'])
  type: 'DEPOSIT' | 'WITHDRAWAL';

  @IsNumberString()
  amount: string;
}
