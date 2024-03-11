import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import { DBAdapter, ResultSet, TransactionCallback } from '../interface/db_adapter';


const DB_NAME = 'expo-sqlite';
const dir = FileSystem.documentDirectory;

export async function setupDb() {

}

export class ExpoSqliteAdapter implements DBAdapter {
    private _db: SQLite.SQLiteDatabase | null;

    constructor() {
        this._db = null;
    }

    // Only to be used after init()
    get db() {
        return this._db as SQLite.SQLiteDatabase;
    }

    async init() {
        const dbPath = dir + 'SQLite/' + DB_NAME;

        try {
            const { exists } = await FileSystem.getInfoAsync(dbPath);
            if (exists) {
                console.log('deleting db file');
                await FileSystem.deleteAsync(dbPath);
            }
        } catch (e) {
            // Ignore
        }

        console.log(`Setup expo db`);
        this._db = SQLite.openDatabase(DB_NAME);

        // db.exec([{ sql: 'CREATE TABLE t1(id INTEGER PRIMARY KEY, a INTEGER, b INTEGER, c TEXT)', args: [] }], false, () => { });
        // db.exec(
        //     [{ sql: 'CREATE TABLE t2(id INTEGER PRIMARY KEY, a INTEGER, b INTEGER, c TEXT)', args: [] }], false, () => { });
        // db.exec([{ sql: 'CREATE TABLE t3(id INTEGER PRIMARY KEY, a INTEGER, b INTEGER, c TEXT)', args: [] }], false, () => { });
        // db.exec([{ sql: 'CREATE INDEX IF NOT EXISTS i3a ON t3(a)', args: [] }], false, () => { });
        // db.exec([{ sql: 'CREATE INDEX IF NOT EXISTS i3b ON t3(b)', args: [] }], false, () => { });

        await this.db.execAsync([{ sql: 'CREATE TABLE t1(id INTEGER PRIMARY KEY, a INTEGER, b INTEGER, c TEXT)', args: [] }], false);
        await this.db.execAsync(
            [{ sql: 'CREATE TABLE t2(id INTEGER PRIMARY KEY, a INTEGER, b INTEGER, c TEXT)', args: [] }], false);
        await this.db.execAsync([{ sql: 'CREATE TABLE t3(id INTEGER PRIMARY KEY, a INTEGER, b INTEGER, c TEXT)', args: [] }], false);
        await this.db.execAsync([{ sql: 'CREATE INDEX IF NOT EXISTS i3a ON t3(a)', args: [] }], false);
        await this.db.execAsync([{ sql: 'CREATE INDEX IF NOT EXISTS i3b ON t3(a)', args: [] }], false);

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

    async transaction(callback: TransactionCallback): Promise<void> {
        return this.db.transactionAsync(async (context) => {
            // call the callback, but map the transaction context
            return callback({
                execute: async (sql: string, params: any[]) => {
                    const result = await context.executeSqlAsync(sql, params);
                    return {
                        rows: result.rows ?? []
                    };
                },
                commit: () => {
                    // const result = context.commit();
                    return {
                        rows: [],
                    };
                },
                rollback: () => {
                    // const result = context.rollback();
                    return {
                        rows: []
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