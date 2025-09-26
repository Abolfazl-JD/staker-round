import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common';
import { DataSource } from 'typeorm';
import { Snapshot } from './entities/snapshot.entity';

@Injectable()
export class SnapshotRepository extends BaseRepository<Snapshot> {
  constructor(dataSource: DataSource) {
    super(dataSource, Snapshot);
  }

  getSnapshotByUserIdAndDate = (userId: number, date: string) => {
    return this.createQueryBuilder('snapshot')
      .where('snapshot.userId = :userId', { userId })
      .andWhere('snapshot.date = :date', { date })
      .getOne();
  };

  getBalanceSumPerUser = (start: string, end: string) => {
    return this.createQueryBuilder('snapshot')
      .select('snapshot.userId', 'userId')
      .addSelect('SUM(snapshot.balance)::text', 'sumBalance')
      .where('snapshot.date BETWEEN :start AND :end', {
        start,
        end,
      })
      .groupBy('snapshot.userId')
      .getRawMany();
  };
}
