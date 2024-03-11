export interface DBAdapter {

    init(): void;

    execute(sql: string, params?: any[]): Promise<ResultSet>;

    transaction(callback: TransactionCallback): Promise<void>;

    close(): Promise<void>;
}

export interface ResultSet {
    rows: any[];
}

export interface SQLTransaction {
    execute(sqlStatement: string, args?: any[]): Promise<ResultSet>;
    commit: () => ResultSet;
    rollback: () => ResultSet;
}

export type TransactionCallback = (transaction: SQLTransaction) => Promise<void>;
