import { forwardRef, Module } from '@nestjs/common';
import { SnapshotService } from './snapshot.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Snapshot } from './entities/snapshot.entity';
import { SnapshotRepository } from './snapshot.repository';
import { RoundsModule } from 'src/rounds/rounds.module';
import { UsersModule } from 'src/users/users.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    UsersModule,
    forwardRef(() => RoundsModule),
    TypeOrmModule.forFeature([Snapshot]),
  ],
  providers: [SnapshotService, SnapshotRepository],
  exports: [SnapshotService],
})
export class SnapshotModule {}
