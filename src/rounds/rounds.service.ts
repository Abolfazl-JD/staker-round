import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { RoundsRepository } from './rounds.repository';
import { differenceInCalendarDays, endOfMonth, startOfMonth } from 'date-fns';
import { Round } from './entities/round.entity';
import { SnapshotService } from 'src/snapshot/snapshot.service';
import { UsersService } from 'src/users/users.service';
import { TransactionsService } from 'src/transactions/transactions.service';
import { BigNumber } from 'bignumber.js';
import { isNil, isNotNil, MutexService, Public } from 'src/common';

@Injectable()
export class RoundsService {
  constructor(
    private readonly repo: RoundsRepository,
    @Inject(forwardRef(() => SnapshotService))
    private snapshotService: SnapshotService,
    private usersService: UsersService,
    private transactionsService: TransactionsService,
    private mutexService: MutexService,
  ) {}

  async ensureRoundForMonth(date: Date) {
    const start = startOfMonth(date);
    const end = endOfMonth(date);
    const startStr = start.toISOString().slice(0, 10);
    const endStr = end.toISOString().slice(0, 10);

    const existing = await this.repo.getRoundByDate(startStr, endStr);

    if (isNil(existing)) {
      await this.repo.create({
        startDate: startStr,
        endDate: endStr,
        profitRatePercent: null,
      });
    }

    await this.closePreviousRound(date);
  }

  async closePreviousRound(date: Date) {
    const prevMonth = new Date(date.getFullYear(), date.getMonth() - 1, 1);
    const prevStart = startOfMonth(prevMonth);
    const prevEnd = endOfMonth(prevMonth);
    const prevStartStr = prevStart.toISOString().slice(0, 10);
    const prevEndStr = prevEnd.toISOString().slice(0, 10);
    const prevRound = await this.repo.getRoundByDate(prevStartStr, prevEndStr);

    if (
      isNotNil(prevRound) &&
      !prevRound.isClosed &&
      date > new Date(prevRound.endDate)
    ) {
      await this.repo.updateById(prevRound.id, { isClosed: true });
    }
  }

  async setProfitRate(
    roundId: number,
    profitRatePercent: string,
    modifierAdminId: number,
  ) {
    const round = await this.getRoundById(roundId);
    if (isNil(round)) throw new NotFoundException('Round not found');
    if (!round.isClosed)
      throw new NotAcceptableException('round has not been concluded yet');
    if (isNotNil(round.profitRatePercent)) {
      throw new NotAcceptableException('round has already been set');
    }

    const updateResult = await this.repo.updateById(roundId, {
      profitRatePercent,
      modifierAdminId,
    });
    if (!updateResult) throw new BadRequestException('could not update round');

    await this.calculateAndDistribute(round);
    return true;
  }

  async calculateAndDistribute(round: Round) {
    return this.mutexService.performExclusively(
      `round-${round.id}`,
      async () => {
        const days =
          differenceInCalendarDays(
            new Date(round.endDate + 'T00:00:00Z'),
            new Date(round.startDate + 'T00:00:00Z'),
          ) + 1;

        const balanceSumPerUser =
          await this.snapshotService.getBalanceSumPerUser(
            round.startDate,
            round.endDate,
          );

        await this.repo.runTransaction(async (manager) => {
          await Promise.all(
            balanceSumPerUser.map(async (row) => {
              const userId = Number(row.userId);
              const sum = new BigNumber(row.sumBalance);

              const avg = sum.dividedBy(days);
              const profit = avg
                .multipliedBy(round.profitRatePercent!)
                .dividedBy(100)
                .integerValue(BigNumber.ROUND_FLOOR);

              if (profit.isGreaterThan(0)) {
                const user = await this.usersService.findById(userId);
                if (isNil(user)) return;

                const newBalance = new BigNumber(user.balance)
                  .plus(profit)
                  .toFixed(2);
                await this.usersService.updateBalance(
                  userId,
                  newBalance,
                  manager,
                );
                await this.transactionsService.generateProfitTransaction(
                  userId,
                  profit.toFixed(2),
                  round.id,
                  manager,
                );
              }
            }),
          );
        });
      },
    );
  }

  private getRoundById(id: number) {
    return this.repo.findById(id);
  }
}
