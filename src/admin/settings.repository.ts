import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Settings } from './entities/settings.entity';
import { BaseRepository } from 'src/common';

@Injectable()
export class SettingsRepository extends BaseRepository<Settings> {
  constructor(dataSource: DataSource) {
    super(dataSource, Settings);
  }
}
