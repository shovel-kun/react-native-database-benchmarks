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
                    return {
                        rows: [],
                    };
                },
                rollback: () => {
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