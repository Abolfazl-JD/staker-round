import { CreateBaseResponse } from 'src/common/types';
import { Transaction } from 'src/transactions/entities/transaction.entity';

export class CreateTransactionResponseDto extends CreateBaseResponse {
  result: Transaction;
}
