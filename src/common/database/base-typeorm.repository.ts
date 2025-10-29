// @ts-nocheck
import {
    DataSource,
    DeepPartial,
    DeleteResult,
    EntityManager,
    EntitySchema,
    FindManyOptions,
    FindOptionsWhere,
    InsertResult,
    ObjectLiteral,
    Repository,
    UpdateResult,
    SelectQueryBuilder,
} from "typeorm";
import {
    QueryDeepPartialEntity,
    QueryPartialEntity,
} from "typeorm/query-builder/QueryPartialEntity";
import { ConcatFieldSearch } from "./dto";
import { isNil, isNotNil } from "../utils";

export type SearchField<T> = keyof T;
export type Filter<T> = {
    [P in keyof T]?: T[P] | Range<T[P]>;
};
export type Sort<T> = Partial<Record<keyof T, SortOrder>>;
export type SortOrder = "ASC" | "DESC";
export type Range<T> = {
    start: T;
    end: T;
};

SelectQueryBuilder.prototype.paginate = function <Entity extends ObjectLiteral>(
    this: SelectQueryBuilder<Entity>,
    pageNumber = 1,
    pageSize = 30,
) {
    this.addSelect(`${pageNumber} as page_number, ${pageSize} as page_size`);

    return this;
};

SelectQueryBuilder.prototype.search = function <Entity extends ObjectLiteral>(
    this: SelectQueryBuilder<Entity>,
    search?: string,
    searchFields?: string[] | string,
    aliases?: string[] | [],
    concatFields?: Record<string, ConcatFieldSearch>,
) {
    if (isNil(search) || isNil(searchFields)) {
        return this;
    }
    if (!Array.isArray(searchFields)) {
        searchFields = [searchFields];
    }
    const searchQuery = searchFields
        .filter((field) => {
            if (concatFields && field in concatFields) {
                return true;
            }
            if (isNotNil(aliases) && aliases.length > 0) {
                return aliases.some((alias) => field.startsWith(`${alias}.`));
            }
            return field.includes(".") ? false : true;
        })
        .map((field) => {
            if (concatFields && field in concatFields) {
                const concatConfig = concatFields[field];
                const { fields, separator, entity } = concatConfig;

                const concatSearchFields = fields
                    .map((f) => `"${entity}"."${f}"`)
                    .join(`, '${separator}', `);

                return `CONCAT(${concatSearchFields}) ILIKE :search`;
            }
            if (field.includes(".")) {
                return `${field} ILIKE :search`;
            } else {
                return `${this.alias}.${field} ILIKE :search`;
            }
        })
        .join(" OR ");
    if (searchQuery !== "") {
        this.andWhere(`(${searchQuery})`, { search: `%${search}%` });
    }
    return this;
};

SelectQueryBuilder.prototype.sort = function <Entity extends ObjectLiteral>(
    this: SelectQueryBuilder<Entity>,
    sort?: Record<string, SortOrder>,
    aliases?: string[],
    staticFields?: string[],
) {
    if (isNil(sort)) {
        this.addOrderBy(`"${this.alias}"."id"`, "DESC");
        return this;
    }

    Object.entries(sort).forEach(([key, order]) => {
        if (staticFields && staticFields.includes(key)) {
            this.addOrderBy(`"${key}"`, order);
        } else if (key.includes(".")) {
            const [entityAlias, field] = key.split(".");
            if (isNotNil(aliases) && aliases.includes(entityAlias)) {
                this.addOrderBy(`"${entityAlias}"."${field}"`, order);
            }
        } else {
            this.addOrderBy(`"${this.alias}"."${String(key)}"`, order);
        }
    });
    return this;
};

SelectQueryBuilder.prototype.filter = function <Entity extends ObjectLiteral>(
    this: SelectQueryBuilder<Entity>,
    filter?: Partial<Record<string, any>>,
    ...aliases: string[]
) {
    if (isNil(filter)) {
        return this;
    }
    if (aliases.length > 0) {
        aliases.forEach((alias) => {
            this.filterByJoined(alias, filter);
        });
    } else {
        Object.entries(filter).forEach(([field, value]) => {
            if (field.split(".").length === 1) {
                this.filterByEntity(this.alias, field, value);
            }
        });
    }

    return this;
};

SelectQueryBuilder.prototype.filterByJoined = function <
    Entity extends ObjectLiteral,
>(
    this: SelectQueryBuilder<Entity>,
    alias: string,
    filter: Partial<Record<string, unknown>>,
): SelectQueryBuilder<Entity> {
    Object.entries(filter).forEach(([key, value]) => {
        const field = key.split(".");
        const hasMatchedEntity = field.length === 2 && field[0] === alias;
        if (hasMatchedEntity) {
            this.filterByEntity(field[0], field[1], value);
        }
    });
    return this;
};

SelectQueryBuilder.prototype.filterByEntity = function <
    Entity extends ObjectLiteral,
>(
    this: SelectQueryBuilder<Entity>,
    entity: string,
    field: string,
    value: unknown,
) {
    if (Array.isArray(value)) {
        this.andWhere(`${entity}.${field} IN (:...array_${field})`, {
            [`array_${field}`]: value,
        });
    } else if (typeof value === "object" && value !== null) {
        if ("start" in value && "end" in value) {
            this.andWhere(
                `${entity}.${field} BETWEEN :start_${field} AND :end_${field}`,
                {
                    [`start_${field}`]: value.start,
                    [`end_${field}`]: value.end,
                },
            );
        } else if ("start" in value) {
            this.andWhere(`${entity}.${field} >= :start_${field}`, {
                [`start_${field}`]: value.start,
            });
        } else if ("end" in value) {
            this.andWhere(`${entity}.${field} <= :end_${field}`, {
                [`end_${field}`]: value.end,
            });
        }
    } else if (value === "null") {
        this.andWhere(`${entity}.${field} IS NULL`);
    } else if (field.slice(-1) === "!") {
        field = field.slice(0, -1);
        this.andWhere(`${entity}.${field} IS DISTINCT FROM :${field}`, {
            [field]: value,
        });
    } else {
        this.andWhere(`${entity}.${field} = :${field}`, { [field]: value });
    }
    return this;
};

SelectQueryBuilder.prototype.getRawManyAndCount = async function <
    Entity extends ObjectLiteral,
>(this: SelectQueryBuilder<Entity>) {
    const totalRecords = await this.getCount();
    this.addSelect(`${totalRecords} as total_records`);
    return this.getRawMany();
};

export interface TypeormRepository<T extends ObjectLiteral> {
    _repo: Repository<T>;

    createQueryBuilder(alias: string): SelectQueryBuilder<T>;
    create(args: DeepPartial<T>): Promise<T>;
    createOrIgnore(
        alias: string,
        args: QueryPartialEntity<T>[],
        columns: string[],
        returningColumns: string[],
    ): Promise<InsertResult>;
    bulkCreate(args: DeepPartial<T>[]): Promise<T[]>;
    save(args: DeepPartial<T>): Promise<T>;

    findAll(relations?: (keyof T)[] & string[]): Promise<T[]>;
    find(filter: FindManyOptions<T>): Promise<T[]>;

    findOne(filter: DeepPartial<T>): Promise<T | null>;
    findById(id: number): Promise<T | null>;
    findByQuery(
        filter: FindOptionsWhere<T>,
        relations?: (keyof T)[] & string[],
    ): Promise<T[]>;
    count(filter?: FindOptionsWhere<T>): Promise<number>;

    updateById(id: number, update: DeepPartial<T>): Promise<boolean>;
    updateOneByQuery(
        filter: DeepPartial<T>,
        update: DeepPartial<T>,
    ): Promise<boolean>;
    updateByQuery(
        filter: FindOptionsWhere<T>,
        update: DeepPartial<T>,
    ): Promise<UpdateResult>;
    updateOneOrCreate(args: DeepPartial<T>, update: DeepPartial<T>): Promise<T>;
    bulkUpdate(
        entities: DeepPartial<T>[],
        findBy: (keyof T)[],
    ): Promise<InsertResult>;

    incrementFieldByQuery(
        filter: FindOptionsWhere<T>,
        property: keyof T & string,
        quantity: number | string,
    ): Promise<UpdateResult>;
    decrementFieldByQuery(
        filter: FindOptionsWhere<T>,
        property: keyof T & string,
        quantity: number | string,
    ): Promise<UpdateResult>;

    upsert(args: DeepPartial<T>, findBy: (keyof T)[]): Promise<void>;
    bulkUpsert(
        entities: DeepPartial<T>[],
        conflictPaths: (keyof T)[],
    ): Promise<InsertResult>;

    deleteById(id: number): Promise<boolean>;
    deleteOneByQuery(filter: DeepPartial<T>): Promise<boolean>;
    deleteByQuery(filter: FindOptionsWhere<T>): Promise<DeleteResult>;
    removeByQuery(query: FindOptionsWhere<T>): Promise<DeleteResult>;

    runTransaction<T>(fn: (manager: EntityManager) => Promise<T>): Promise<T>;
}

export abstract class BaseRepository<T extends ObjectLiteral>
    implements TypeormRepository<T>
{
    _dataSource: DataSource;
    _repo: Repository<T>;
    _manager: EntityManager;
    _schema: EntitySchema<T>;

    constructor(dataSource: DataSource, schema: EntitySchema<T> | Function) {
        this._dataSource = dataSource;
        this._repo = this._dataSource.getRepository<T>(schema);
        this._manager = this._dataSource.manager;
        this._schema = schema;
    }

    createQueryBuilder(alias: string, { manager = this._manager } = {}) {
        return manager.getRepository(this._schema).createQueryBuilder(alias);
    }

    create(args: DeepPartial<T>, { manager = this._manager } = {}): Promise<T> {
        return manager.getRepository(this._schema).save(args);
    }

    createOrIgnore(
        alias: string,
        args: QueryPartialEntity<T>[],
        columns: string[],
        returningColumns: string[] = columns,
        { manager = this._manager } = {},
    ): Promise<InsertResult> {
        return manager
            .getRepository(this._schema)
            .createQueryBuilder()
            .insert()
            .into(alias, columns)
            .values(args)
            .returning(returningColumns)
            .orIgnore()
            .execute();
    }

    bulkCreate(
        entities: DeepPartial<T>[],
        { manager = this._manager } = {},
    ): Promise<T[]> {
        return manager.getRepository(this._schema).save(entities);
    }

    save(entity: DeepPartial<T>, { manager = this._manager } = {}) {
        return manager.getRepository(this._schema).save(entity);
    }

    findAll(
        relations?: (keyof T)[] & string[],
        { manager = this._manager } = {},
    ): Promise<T[]> {
        return manager.getRepository(this._schema).find({ relations });
    }

    find(
        filter: FindManyOptions<T>,
        { manager = this._manager } = {},
    ): Promise<T[]> {
        return manager.getRepository(this._schema).find(filter);
    }

    findOne(
        filter: DeepPartial<T>,
        relations?: (keyof T)[] & string[],
        { manager = this._manager } = {},
    ): Promise<T | null> {
        return manager.getRepository(this._schema).findOne({
            where: filter as FindOptionsWhere<T>,
            relations,
        });
    }

    findById(
        id: number,
        relations?: (keyof T)[] & string[],
        { manager = this._manager } = {},
    ): Promise<T | null> {
        return manager.getRepository(this._schema).findOne({
            where: { id } as unknown as FindOptionsWhere<T>,
            relations,
        });
    }

    findByQuery(
        filter: FindOptionsWhere<T>,
        relations?: (keyof T)[] & string[],
        { manager = this._manager } = {},
    ): Promise<T[]> {
        return manager
            .getRepository(this._schema)
            .find({ where: filter, relations });
    }

    count(
        filter?: FindOptionsWhere<T>,
        { manager = this._manager } = {},
    ): Promise<number> {
        return manager.getRepository(this._schema).count({ where: filter });
    }

    async updateById(
        id: number,
        update: DeepPartial<T>,
        { manager = this._manager } = {},
    ): Promise<boolean> {
        const result = await manager
            .getRepository(this._schema)
            .update(id, update as QueryDeepPartialEntity<T>);
        return result.affected === 1;
    }

    async updateOneByQuery(
        filter: DeepPartial<T>,
        update: DeepPartial<T>,
        { manager = this._manager } = {},
    ): Promise<boolean> {
        const result = await manager
            .getRepository(this._schema)
            .update(
                filter as FindOptionsWhere<T>,
                update as QueryDeepPartialEntity<T>,
            );
        return result.affected === 1;
    }

    updateByQuery(
        filter: FindOptionsWhere<T>,
        update: DeepPartial<T>,
        { manager = this._manager } = {},
    ): Promise<UpdateResult> {
        return manager
            .getRepository(this._schema)
            .update(filter, update as QueryDeepPartialEntity<T>);
    }

    async updateOneOrCreate(
        filter: DeepPartial<T>,
        update: DeepPartial<T>,
        { manager = this._manager } = {},
    ): Promise<T> {
        const repo = manager.getRepository(this._schema);

        const existing = await repo.findOne({
            where: filter as FindOptionsWhere<T>,
        });

        if (existing) {
            const merged = repo.merge(existing, update);
            return repo.save(merged);
        }

        const created = repo.create({ ...filter, ...update });
        return repo.save(created);
    }

    bulkUpdate(
        entities: DeepPartial<T>[],
        findBy: (keyof T)[],
        { manager = this._manager } = {},
    ): Promise<InsertResult> {
        return manager
            .getRepository(this._schema)
            .upsert(entities as QueryDeepPartialEntity<T>, {
                conflictPaths: findBy as string[],
                upsertType: "on-conflict-do-update",
            });
    }

    incrementFieldByQuery(
        filter: FindOptionsWhere<T>,
        property: keyof T & string,
        quantity: number | string,
        { manager = this._manager } = {},
    ) {
        return manager
            .getRepository(this._schema)
            .increment(filter, property, quantity);
    }

    decrementFieldByQuery(
        filter: FindOptionsWhere<T>,
        property: keyof T & string,
        quantity: number | string,
        { manager = this._manager } = {},
    ) {
        return manager
            .getRepository(this._schema)
            .decrement(filter, property, quantity);
    }

    async upsert(
        args: DeepPartial<T>,
        findBy: (keyof T)[],
        { manager = this._manager } = {},
    ): Promise<void> {
        await manager
            .getRepository(this._schema)
            .upsert(args as QueryDeepPartialEntity<T>, findBy as string[]);
    }

    bulkUpsert(
        entities: DeepPartial<T>[],
        conflictPaths: (keyof T)[],
        { manager = this._manager } = {},
    ): Promise<InsertResult> {
        return manager
            .getRepository(this._schema)
            .upsert(entities as QueryDeepPartialEntity<T>[], {
                conflictPaths: conflictPaths as string[],
                upsertType: "on-conflict-do-update",
            });
    }

    async deleteById(
        id: number,
        { manager = this._manager } = {},
    ): Promise<boolean> {
        const result = await manager.getRepository(this._schema).delete(id);
        return result.affected === 1;
    }

    async deleteOneByQuery(
        filter: DeepPartial<T>,
        { manager = this._manager } = {},
    ): Promise<boolean> {
        const result = await manager
            .getRepository(this._schema)
            .delete(filter as FindOptionsWhere<T>);
        return result.affected === 1;
    }

    deleteByQuery(
        filter: FindOptionsWhere<T>,
        { manager = this._manager } = {},
    ): Promise<DeleteResult> {
        return manager.getRepository(this._schema).delete(filter);
    }

    removeByQuery(
        query: FindOptionsWhere<T>,
        { manager = this._manager } = {},
    ) {
        return manager.getRepository(this._schema).softDelete(query);
    }

    async runTransaction<T>(
        fn: (manager: EntityManager) => Promise<T>,
    ): Promise<T> {
        const queryRunner = this._dataSource.createQueryRunner();
        await queryRunner.startTransaction();
        try {
            const result = await fn(queryRunner.manager);
            await queryRunner.commitTransaction();
            await queryRunner.release();
            return result;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            await queryRunner.release();
            throw error;
        }
    }
}
