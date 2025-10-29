import { Injectable } from "@nestjs/common";
import { UsersRepository } from "./users.repository";
import { EntityManager } from "typeorm";

@Injectable()
export class UsersService {
    constructor(private readonly repo: UsersRepository) {}

    createUser(email: string, passwordHash: string) {
        return this.repo.create({ email, passwordHash });
    }

    findByEmail(email: string) {
        return this.repo.findOne({ email });
    }

    findById(id: number) {
        return this.repo.findById(id);
    }

    findAll() {
        return this.repo.find({});
    }

    updateBalance(id: number, balance: string, manager: EntityManager) {
        return this.repo.updateById(id, { balance }, { manager });
    }
}
