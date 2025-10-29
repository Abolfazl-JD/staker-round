import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
} from "typeorm";
import { Role } from "../enums";
import { Exclude } from "class-transformer";

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    email: string;

    @Exclude()
    @Column()
    passwordHash: string;

    @Column({ type: "numeric", default: "0" })
    balance: string;

    @Column({ type: "enum", enum: Role, default: Role.User })
    role: Role;

    @CreateDateColumn()
    createdAt: Date;
}
