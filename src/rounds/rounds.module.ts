import { forwardRef, Module } from '@nestjs/common';
import { RoundsController } from './rounds.controller';
import { RoundsService } from './rounds.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Round } from './entities/round.entity';
import { RoundsRepository } from './rounds.repository';
import { SnapshotModule } from 'src/snapshot/snapshot.module';
import { UsersModule } from 'src/users/users.module';
import { TransactionsModule } from 'src/transactions/transactions.module';

@Module({
  imports: [
    TransactionsModule,
    UsersModule,
    forwardRef(() => SnapshotModule),
    TypeOrmModule.forFeature([Round]),
  ],
  controllers: [RoundsController],
  providers: [RoundsService, RoundsRepository],
  exports: [RoundsService],
})
export class RoundsModule {}
