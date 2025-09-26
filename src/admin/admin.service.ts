import { Injectable } from '@nestjs/common';
import { SettingsRepository } from './settings.repository';
import { isNil } from 'src/common';

@Injectable()
export class AdminService {
  constructor(private readonly repo: SettingsRepository) {}

  async updateTax(newTaxPercent: string) {
    let settings = await this.repo.findOne({});
    if (isNil(settings))
      settings = await this.repo.create({ taxPercent: newTaxPercent });

    return this.repo.updateById(settings.id, { taxPercent: newTaxPercent });
  }

  async getSettings() {
    let settings = await this.repo.findOne({});
    if (isNil(settings)) {
      settings = await this.repo.create({ taxPercent: '1.0000' });
    }

    return settings;
  }
}
