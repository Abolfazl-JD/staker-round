import { OKBaseResponse } from 'src/common/types';
import { Transaction } from 'src/transactions/entities/transaction.entity';

export class AdminTransactionsResponseDto extends OKBaseResponse {
  result: Transaction[];

  /**
    @example 100
   */
  total: number;
}
