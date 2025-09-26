import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { SnapshotRepository } from './snapshot.repository';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RoundsService } from 'src/rounds/rounds.service';
import { UsersService } from 'src/users/users.service';
import { isNil } from 'src/common';

@Injectable()
export class SnapshotService {
  constructor(
    private readonly repo: SnapshotRepository,
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => RoundsService))
    private readonly roundsService: RoundsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async takeDailySnapshot() {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10);

    await this.roundsService.ensureRoundForMonth(today);

    const users = await this.usersService.findAll();
    for (const u of users) {
      const exists = await this.repo.getSnapshotByUserIdAndDate(u.id, dateStr);

      if (isNil(exists)) {
        await this.repo.create({
          userId: u.id,
          date: dateStr,
          balance: u.balance,
        });
      }
    }
  }

  getBalanceSumPerUser(start: string, end: string) {
    return this.repo.getBalanceSumPerUser(start, end);
  }
}
