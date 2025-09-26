import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Round } from './entities/round.entity';
import { BaseRepository } from 'src/common';

@Injectable()
export class RoundsRepository extends BaseRepository<Round> {
  constructor(dataSource: DataSource) {
    super(dataSource, Round);
  }

  getRoundByDate = (startDate: string, endDate: string) => {
    return this.createQueryBuilder('round')
      .where('round.startDate = :startDate', { startDate })
      .andWhere('round.endDate = :endDate', { endDate })
      .getOne();
  };
}
