import * as SQLite from 'expo-sqlite';
import { AbstractDBAdapter, DBAdapter, ResultSet, SQLBatchTuple, TransactionCallback } from '../interface/db_adapter';
import { ClassNotImplementedError } from '../errors/errors';
import { deleteDbFile, getDbPath } from '../database/utils';

const DB_NAME = 'expo-sqlite';

export class ExpoSqliteAdapter extends AbstractDBAdapter {
  private _db: SQLite.SQLiteDatabase | null;

  constructor() {
    super();
    this._db = null;
  }

  // Only to be used after init()
  get db() {
    return this._db as SQLite.SQLiteDatabase;
  }

  async init() {
    const dbPath = getDbPath(DB_NAME);

    await deleteDbFile(dbPath);

    this._db = await SQLite.openDatabaseAsync(DB_NAME);

    await this._db.execAsync('PRAGMA journal_mode = WAL');
  }

  async execute(sql: string, params?: any[]): Promise<ResultSet> {
    let result: SQLite.SQLiteRunResult = await this.db.runAsync(sql, params ?? []);
    // const result = results[0];
    return {
      rows: [],
      rowsAffected: result.changes
    };
  }

  executeBatch(commands: SQLBatchTuple[]): Promise<ResultSet> {
    throw new ClassNotImplementedError('ExecuteBatch() method not implemented.');
  }

  async transaction(callback: TransactionCallback): Promise<void> {
    return await this.db.withTransactionAsync(async () => {
      return callback({
        execute: async (sql: string, params: any[]) => {
          const result = await this.db.runAsync(sql, params);
          return {
            rows: [],
            rowsAffected: result.changes
          };
        }
      });
    });
  }

  async close(): Promise<void> {
    await this.db.closeAsync();
  }
}
