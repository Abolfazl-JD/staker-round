import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import { Status } from './enums';
import { BaseRepository } from 'src/common';

@Injectable()
export class TransactionsRepository extends BaseRepository<Transaction> {
  constructor(dataSource: DataSource) {
    super(dataSource, Transaction);
  }

  getUserTransactions = (userId: number, status: Status) => {
    return this.createQueryBuilder('transaction')
      .where('transaction.userId = :userId', { userId })
      .andWhere('transaction.status = :status', { status })
      .orderBy('transaction.createdAt', 'DESC')
      .getMany();
  };

  getAllTransactions = (status: Status) => {
    return this.createQueryBuilder('transaction')
      .where('transaction.status = :status', { status })
      .leftJoinAndSelect('transaction.user', 'user')
      .leftJoinAndSelect('transaction.modifierAdmin', 'modifierAdmin')
      .orderBy('transaction.createdAt', 'DESC')
      .getMany();
  };

  getUserTransactionById = (transactionId: number) => {
    return this.createQueryBuilder('transaction')
      .where('transaction.id = :transactionId', { transactionId })
      .leftJoinAndSelect('user', 'user', 'user.id = transaction.userId')
      .getOne();
  };
}
