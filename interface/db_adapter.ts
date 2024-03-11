export interface DBAdapter {

    init(): Promise<void>;

    execute(sql: string, params?: any[]): Promise<ResultSet>;

    executeBatch(commands: SQLBatchTuple[]): Promise<ResultSet>;

    transaction(callback: TransactionCallback): Promise<void>;

    manualTransaction(callback: ManualTransactionCallback): Promise<void>;

    close(): Promise<void>;
}

export abstract class AbstractDBAdapter implements DBAdapter {
    abstract init(): Promise<void>;

    abstract execute(sql: string, params?: any[]): Promise<ResultSet>;

    abstract transaction(callback: TransactionCallback): Promise<void>;

    abstract close(): Promise<void>;

    abstract executeBatch(commands: SQLBatchTuple[]): Promise<ResultSet>;

    /** 
     * Manually starts a transaction as some libraries do not support 
     * calling a batch execute inside transaction contexts.
    */
    async manualTransaction(callback: ManualTransactionCallback) {
        try {
            await this.execute('BEGIN TRANSACTION');
            await callback(this);
            // await this.execute('COMMIT');
        } catch (e) {
            console.log(e);
            // await this.execute('ROLLBACK');
            throw e;
        }
    }
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

export type ManualTransactionCallback = (db: DBAdapter) => Promise<void>;