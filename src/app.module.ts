import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { UsersModule } from "./users/users.module";
import { AuthModule } from "./auth/auth.module";
import { TransactionsModule } from "./transactions/transactions.module";
import { AdminModule } from "./admin/admin.module";
import { SnapshotModule } from "./snapshot/snapshot.module";
import { RoundsModule } from "./rounds/rounds.module";
import { appDataSource, MutexModule } from "./common";

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        appDataSource,
        UsersModule,
        AuthModule,
        TransactionsModule,
        AdminModule,
        SnapshotModule,
        RoundsModule,
        MutexModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule {}
