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

    console.log(`Setup expo db`);
    this._db = SQLite.openDatabase(DB_NAME);
    console.log(`Setup expo done`);
  }

  async execute(sql: string, params?: any[]): Promise<ResultSet> {
    let results;
    if (params != null && params!.length > 0) {
      results = await this.db.execAsync([{ sql: sql, args: [...params] }], false);
    } else {
      results = await this.db.execAsync([{ sql: sql, args: [] }], false);
    }
    const result = results[0];
    if (this.isResultSetError(result)) {
      throw result.error;
    }
    if (this.isResultSet(result)) {
      return {
        rows: result.rows
      };
    }
    return {
      rows: []
    };
  }

  executeBatch(commands: SQLBatchTuple[]): Promise<ResultSet> {
    throw new ClassNotImplementedError('ExecuteBatch() method not implemented.');
  }

  async transaction(callback: TransactionCallback): Promise<void> {
    return await this.db.transactionAsync(async (context) => {
      // call the callback, but map the transaction context
      return callback({
        execute: async (sql: string, params: any[]) => {
          const result = await context.executeSqlAsync(sql, params);
          return {
            rows: result.rows ?? []
          };
        }
      });
    });
  }

  async close(): Promise<void> {
    await this.db.closeAsync();
  }

  isResultSet(result: SQLite.ResultSetError | SQLite.ResultSet): result is SQLite.ResultSet {
    return (result as SQLite.ResultSet).rows !== undefined;
  }

  isResultSetError(result: SQLite.ResultSetError | SQLite.ResultSet): result is SQLite.ResultSetError {
    return (result as SQLite.ResultSetError).error !== undefined;
  }
}
