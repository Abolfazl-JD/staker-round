import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Settings {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'decimal', precision: 6, scale: 4, default: '1.0000' })
  taxPercent: string;

  @UpdateDateColumn()
  updatedAt: Date;
}
