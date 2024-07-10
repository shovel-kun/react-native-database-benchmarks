export interface DBAdapter {
  init(): Promise<void>;

  execute(sql: string, params?: any[]): Promise<ResultSet>;

  /**
   * This runs in a transaction under the hood. There is no need to
   * wrap it in an explicit transaction for op-sqlite and powersync-sqlite.
   */
  executeBatch(commands: SQLBatchTuple[]): Promise<ResultSet>;

  transaction(callback: TransactionCallback): Promise<void>;

  close(): Promise<void>;
}

export abstract class AbstractDBAdapter implements DBAdapter {
  abstract init(): Promise<void>;

  abstract execute(sql: string, params?: any[]): Promise<ResultSet>;

  abstract transaction(callback: TransactionCallback): Promise<void>;

  abstract close(): Promise<void>;

  abstract executeBatch(commands: SQLBatchTuple[]): Promise<ResultSet>;
}

export interface ResultSet {
  rows?: any[];
  rowsAffected?: number;
}

export interface SQLTransaction {
  execute(sqlStatement: string, args?: any[]): Promise<ResultSet>;
}

export type TransactionCallback = (transaction: SQLTransaction) => Promise<void>;

export type SQLBatchTuple = [string] | [string, Array<any> | Array<Array<any>>];
