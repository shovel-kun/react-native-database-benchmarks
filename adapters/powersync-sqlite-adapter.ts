import * as FileSystem from 'expo-file-system';
import { AbstractDBAdapter, DBAdapter, ManualTransactionCallback, ResultSet, SQLBatchTuple, TransactionCallback } from '../interface/db_adapter';
import { QuickSQLiteConnection, open } from '@journeyapps/react-native-quick-sqlite';

const DB_NAME = 'powersync-sqlite';
const dir = FileSystem.documentDirectory;

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
        const dbPath = dir + `${DB_NAME}.db`;

        try {
            const { exists } = await FileSystem.getInfoAsync(dbPath);
            if (exists) {
                console.log('deleting db file');
                await FileSystem.deleteAsync(dbPath);
            }
        } catch (e) {
            // Ignore
        }

        console.log(`Setup ps-sqlite db`);

        this._db = open(DB_NAME, {
            location: dir!,
        });

        console.log(`Setup ps-sqlite done`);
    }

    async execute(sql: string, params?: any[]): Promise<ResultSet> {
        const results = await this.db.execute(sql, params);
        return {
            rows: results.rows?._array ?? [],
            rowsAffected: results.rowsAffected,
        };
    }

    async executeBatch(commands: SQLBatchTuple[]): Promise<ResultSet> {
        const results = await this.db.executeBatch(commands);
        return {
            rowsAffected: results.rowsAffected,
        };
    }

    async transaction(callback: TransactionCallback): Promise<void> {
        return await this.db.writeTransaction(async (context) => {
            // call the callback, but map the transaction context
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