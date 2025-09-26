import {
  Injectable,
  NotAcceptableException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { TransactionsRepository } from './transactions.repository';
import { Transaction } from './entities/transaction.entity';
import { EntityManager } from 'typeorm';
import { AdminService } from 'src/admin/admin.service';
import { BigNumber } from 'bignumber.js';
import { isNil, MutexService } from 'src/common';
import { CreateTransactionDto, UpdateTransactionStatusDto } from './dto';
import { Status, TransactionType } from './enums';

@Injectable()
export class TransactionsService {
  constructor(
    private readonly repo: TransactionsRepository,
    private readonly usersService: UsersService,
    private readonly adminService: AdminService,
    private readonly mutexService: MutexService,
  ) {}

  async create(userId: number, dto: CreateTransactionDto) {
    return this.mutexService.performExclusively(`user-${userId}`, async () => {
      const { amount, type } = dto;
      const user = await this.usersService.findById(userId);
      if (isNil(user)) throw new NotFoundException('User not found');

      const userPendingTransactions = await this.getUserTransactions(
        userId,
        Status.PENDING,
      );

      if (userPendingTransactions.length) {
        throw new NotAcceptableException(
          'User already has a pending transaction',
        );
      }

      if (dto.type === 'WITHDRAWAL') {
        const balance = new BigNumber(user.balance);
        if (balance.lt(amount)) {
          throw new UnprocessableEntityException('Insufficient balance');
        }
      }

      const transaction = this.repo.create({
        type:
          type === 'DEPOSIT'
            ? TransactionType.DEPOSIT
            : TransactionType.WITHDRAWAL,
        amount,
        userId,
      });

      return transaction;
    });
  }

  getUserTransactions(userId: number, status: Status) {
    return this.repo.getUserTransactions(userId, status);
  }

  getAllTransactions(status: Status) {
    return this.repo.getAllTransactions(status);
  }

  getTransactionById(transactionId: number) {
    return this.repo.getUserTransactionById(transactionId);
  }

  async updateTransactionStatus(
    dto: UpdateTransactionStatusDto,
    transactionId: number,
    modifierAdminId: number,
  ) {
    return this.mutexService.performExclusively(
      `update-transaction-${transactionId}`,
      async () => {
        const { newStatus } = dto;

        await this.repo.runTransaction(async (manager) => {
          const transaction = await this.getTransactionById(transactionId);

          if (isNil(transaction)) {
            throw new NotFoundException('Transaction not found');
          }

          if (transaction.status !== 'PENDING') {
            throw new NotAcceptableException('Transaction is not pending');
          }

          if (
            transaction.type !== TransactionType.DEPOSIT &&
            transaction.type !== TransactionType.WITHDRAWAL
          ) {
            throw new UnprocessableEntityException(
              'Transaction type is not valid',
            );
          }

          const settings = await this.adminService.getSettings();
          const taxPercent = settings.taxPercent;

          const user = await this.usersService.findById(transaction.userId);
          if (isNil(user)) {
            throw new NotFoundException('User not found');
          }
          if (newStatus === Status.APPROVED) {
            const txAmount = BigNumber(transaction.amount);
            const tax = txAmount.multipliedBy(taxPercent).dividedBy(100);

            const net = txAmount.minus(tax);

            const newBalance =
              transaction.type === TransactionType.DEPOSIT
                ? new BigNumber(user.balance).plus(net).toFixed(2)
                : new BigNumber(user.balance).minus(net).toFixed(2);

            await this.usersService.updateBalance(user.id, newBalance, manager);

            const taxAmount = tax.toFixed(2);
            await this.updateTransaction(
              transactionId,
              { status: Status.APPROVED, taxAmount, modifierAdminId },
              manager,
            );
            await this.generateTaxTransaction(
              user.id,
              taxAmount,
              transactionId,
              manager,
            );
          } else {
            await this.updateTransaction(
              transactionId,
              { status: Status.REJECTED, modifierAdminId },
              manager,
            );
          }
        });
      },
    );
  }

  generateProfitTransaction(
    userId: number,
    amount: string,
    roundId: number,
    manager: EntityManager,
  ) {
    return this.repo.create(
      {
        type: TransactionType.PROFIT,
        amount,
        status: Status.COMPLETED,
        sourceId: roundId,
        userId,
      },
      manager,
    );
  }

  private generateTaxTransaction(
    userId: number,
    amount: string,
    transactionId: number,
    manager: EntityManager,
  ) {
    return this.repo.create(
      {
        type: TransactionType.TAX,
        amount,
        status: Status.COMPLETED,
        sourceId: transactionId,
        userId,
      },
      manager,
    );
  }

  private updateTransaction(
    transactionId: number,
    dto: Partial<Transaction>,
    manager: EntityManager,
  ) {
    return this.repo.updateById(transactionId, dto, manager);
  }
}
