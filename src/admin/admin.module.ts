import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Settings } from './entities/settings.entity';
import { SettingsRepository } from './settings.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Settings])],
  controllers: [AdminController],
  providers: [AdminService, SettingsRepository],
  exports: [AdminService],
})
export class AdminModule {}
