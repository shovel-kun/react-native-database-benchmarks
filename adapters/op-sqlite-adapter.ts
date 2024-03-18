import { OPSQLiteConnection, open } from '@op-engineering/op-sqlite';
import { AbstractDBAdapter, DBAdapter, ResultSet, SQLBatchTuple, TransactionCallback } from '../interface/db_adapter';
import { deleteDbFile, getDbPath } from '../database/utils';

const DB_NAME = 'op-sqlite';

export class OPSqliteAdapter extends AbstractDBAdapter {
  private _db: OPSQLiteConnection | null;

  constructor() {
    super();
    this._db = null;
  }

  // Only to be used after init()
  get db() {
    return this._db as OPSQLiteConnection;
  }

  async init() {
    const dbPath = getDbPath(DB_NAME);

    await deleteDbFile(dbPath);

    const DB_CONFIG = {
      name: DB_NAME,
      location: dbPath
    };

    console.log(`Setup op-sqlite db`);

    this._db = open(DB_CONFIG);

    console.log(`Setup op-sqlite done`);
  }

  async executeSync(sql: string, params?: any[]): Promise<ResultSet> {
    const results = this.db.execute(sql, params);
    return {
      rows: results.rows?._array ?? []
    };
  }

  async execute(sql: string, params?: any[]): Promise<ResultSet> {
    const results = await this.db.executeAsync(sql, params);
    return {
      rows: results.rows?._array ?? []
    };
  }

  async executeBatch(commands: SQLBatchTuple[]): Promise<ResultSet> {
    const results = await this.db.executeBatchAsync(commands);
    return {
      rowsAffected: results.rowsAffected,
    };
  }

  async transaction(callback: TransactionCallback): Promise<void> {
    return await this.db.transaction(async (context) => {
      // call the callback, but map the transaction context
      return callback({
        execute: async (sql: string, params: []) => {
          const result = await context.executeAsync(sql, params);
          return {
            rows: result.rows?._array ?? []
          };
        }
      });
    });
  }

  async close(): Promise<void> {
    this.db.close();
  }
}