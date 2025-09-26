import { User } from 'src/users/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Status, TransactionType } from '../enums';

@Entity()
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    nullable: true,
  })
  @Exclude()
  modifierAdminId: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'modifierAdminId' })
  modifierAdmin: User;

  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  type: TransactionType;

  @Column({ type: 'numeric' })
  amount: string; // cents

  @Column({ nullable: true })
  taxAmount: string;

  @Column({ nullable: true })
  sourceId: number;

  @Column({ type: 'enum', enum: Status, default: Status.PENDING })
  status: Status;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
