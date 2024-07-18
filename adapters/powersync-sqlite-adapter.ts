import { AbstractDBAdapter, ResultSet, SQLBatchTuple, TransactionCallback } from '../interface/db_adapter';
import { QuickSQLiteConnection, open } from '@powersync/react-native-quick-sqlite';
import { deleteDbFile, getDbPath } from '../database/utils';

const DB_NAME = 'powersync-sqlite';

export class PowersyncSqliteAdapter extends AbstractDBAdapter {
  private _db: QuickSQLiteConnection | null;

  constructor() {
    super();
    this._db = null;
  }

  // Only to be used after init()
  get db() {
    return this._db as QuickSQLiteConnection;
  }

  async init() {
    const dbPath = getDbPath(DB_NAME);

    await deleteDbFile(dbPath);

    this._db = open(DB_NAME, {
      location: dbPath
    });
  }

  async execute(sql: string, params?: any[]): Promise<ResultSet> {
    const results = await this.db.execute(sql, params);
    return {
      rows: results.rows?._array ?? [],
      rowsAffected: results.rowsAffected
    };
  }

  async executeBatch(commands: SQLBatchTuple[]): Promise<ResultSet> {
    const results = await this.db.executeBatch(commands);
    return {
      rowsAffected: results.rowsAffected
    };
  }

  async transaction(callback: TransactionCallback): Promise<void> {
    return await this.db.writeTransaction(async (context) => {
      return callback({
        execute: async (sql: string, params: []) => {
          const result = await context.execute(sql, params);
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
