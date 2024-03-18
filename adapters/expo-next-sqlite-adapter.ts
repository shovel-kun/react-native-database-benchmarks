import * as SQLite from 'expo-sqlite/next';
import { AbstractDBAdapter, ResultSet, SQLBatchTuple, TransactionCallback } from '../interface/db_adapter';
import { ClassNotImplementedError } from '../errors/errors';
import { deleteDbFile, getDbPath } from '../database/utils';

const DB_NAME = 'expo-next-sqlite';

export class ExpoNextSqliteAdapter extends AbstractDBAdapter {
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

    console.log(`Setup expo-next db`);
    this._db = await SQLite.openDatabaseAsync(DB_NAME);
    console.log(`Setup expo-next done`);
  }

  async execute(sql: string, params?: any[]): Promise<ResultSet> {
    let results: SQLite.SQLiteRunResult;
    if (params != null && params!.length > 0) {
      results = await this.db.runAsync(sql, params);
    } else {
      results = await this.db.runAsync(sql, []);
    }
    const result = results.changes;
    return {
      rows: [],
      rowsAffected: result
    };
  }

  async executeBatch(commands: SQLBatchTuple[]): Promise<ResultSet> {
    throw new ClassNotImplementedError('ExecuteBatch() method not implemented.');
    // let sql: string = '';
    // for (let command in commands) {
    //     sql += `${command}\n`;
    // }
    // await this.db.execAsync(sql);
    // return {};
  }

  async transaction(callback: TransactionCallback): Promise<void> {
    return await this.db.withTransactionAsync(async () => {
      // call the callback, but map the transaction context
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
