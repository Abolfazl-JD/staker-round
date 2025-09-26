import { User } from 'src/users/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity()
export class Round {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  startDate: string;

  @Column({ type: 'date' })
  endDate: string;

  @Column({ default: false })
  isClosed: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  profitRatePercent: string | null;

  @Column({ nullable: true })
  modifierAdminId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'modifierAdminId' })
  modifierAdmin: User;

  @CreateDateColumn()
  createdAt: Date;
}
