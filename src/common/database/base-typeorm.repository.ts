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
} from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';

export abstract class BaseRepository<T extends ObjectLiteral> {
  protected readonly dataSource: DataSource;
  protected readonly repo: Repository<T>;
  protected readonly manager: EntityManager;
  protected readonly schema: EntitySchema<T> | Function; // Supports both class and schema

  constructor(dataSource: DataSource, schema: EntitySchema<T> | Function) {
    this.dataSource = dataSource;
    this.repo = this.dataSource.getRepository<T>(schema);
    this.manager = this.dataSource.manager;
    this.schema = schema;
  }

  /** ===========================
   *   CRUD OPERATIONS
   * ============================ */
  async create(entity: DeepPartial<T>, manager?: EntityManager): Promise<T> {
    return (manager ?? this.dataSource.manager)
      .getRepository(this.schema)
      .save(entity);
  }

  async findOne(
    filter: FindOptionsWhere<T>,
    relations?: (keyof T)[] & string[],
    manager?: EntityManager,
  ): Promise<T | null> {
    return (manager ?? this.dataSource.manager)
      .getRepository(this.schema)
      .findOne({
        where: filter,
        relations,
      });
  }

  async findById(
    id: number,
    relations?: (keyof T)[] & string[],
    manager?: EntityManager,
  ): Promise<T | null> {
    return (manager ?? this.dataSource.manager)
      .getRepository(this.schema)
      .findOne({
        where: { id } as unknown as FindOptionsWhere<T>,
        relations,
      });
  }

  async findByQuery(
    filter: FindOptionsWhere<T>,
    relations?: (keyof T)[] & string[],
    manager?: EntityManager,
  ): Promise<T[]> {
    return (manager ?? this.dataSource.manager)
      .getRepository(this.schema)
      .find({
        where: filter,
        relations,
      });
  }

  async find(
    options: FindManyOptions<T>,
    manager?: EntityManager,
  ): Promise<T[]> {
    return (manager ?? this.dataSource.manager)
      .getRepository(this.schema)
      .find(options);
  }

  async updateById(
    id: number,
    update: DeepPartial<T>,
    manager?: EntityManager,
  ): Promise<boolean> {
    const result = await (manager ?? this.dataSource.manager)
      .getRepository(this.schema)
      .update(id, update as QueryDeepPartialEntity<T>);
    return result.affected === 1;
  }

  async updateByQuery(
    filter: FindOptionsWhere<T>,
    update: DeepPartial<T>,
    manager?: EntityManager,
  ): Promise<UpdateResult> {
    return (manager ?? this.dataSource.manager)
      .getRepository(this.schema)
      .update(filter, update as QueryDeepPartialEntity<T>);
  }

  async deleteById(id: number, manager?: EntityManager): Promise<boolean> {
    const result = await (manager ?? this.dataSource.manager)
      .getRepository(this.schema)
      .delete(id);
    return result.affected === 1;
  }

  async deleteByQuery(
    filter: FindOptionsWhere<T>,
    manager?: EntityManager,
  ): Promise<DeleteResult> {
    return (manager ?? this.dataSource.manager)
      .getRepository(this.schema)
      .delete(filter);
  }

  /** ===========================
   *   BULK OPERATIONS
   * ============================ */
  async bulkCreate(
    entities: DeepPartial<T>[],
    manager?: EntityManager,
  ): Promise<T[]> {
    return (manager ?? this.dataSource.manager)
      .getRepository(this.schema)
      .save(entities);
  }

  async bulkUpsert(
    entities: DeepPartial<T>[],
    conflictPaths: (keyof T)[],
    manager?: EntityManager,
  ): Promise<InsertResult> {
    return (manager ?? this.dataSource.manager)
      .getRepository(this.schema)
      .upsert(entities as QueryDeepPartialEntity<T>, {
        conflictPaths: conflictPaths as string[],
        upsertType: 'on-conflict-do-update',
      });
  }

  /** ===========================
   *   TRANSACTION HELPER
   * ============================ */
  async runTransaction<R>(
    work: (manager: EntityManager) => Promise<R>,
  ): Promise<R> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const result = await work(queryRunner.manager);
      await queryRunner.commitTransaction();
      return result;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /** ===========================
   *   QUERY BUILDER
   * ============================ */
  createQueryBuilder(alias: string, manager?: EntityManager) {
    return (manager ?? this.dataSource.manager)
      .getRepository(this.schema)
      .createQueryBuilder(alias);
  }
}
