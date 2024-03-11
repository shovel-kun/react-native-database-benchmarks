import * as SQLite from 'expo-sqlite';
import { randomIntFromInterval, numberName, assertAlways } from './Utils';
import * as FileSystem from 'expo-file-system';
import Benchmark, { BenchmarkResults } from '../interface/benchmark';
import { ExpoSqliteAdapter } from '../adapters/expo-sqlite-adapter';

const DB_NAME = 'expo-sqlite';
const dir = FileSystem.documentDirectory;

let db: SQLite.SQLiteDatabase;

export class ExpoSqlite {
    private _bm: Benchmark | null;

    constructor() {
        this._bm = null;
    }

    // Only to be used after setUp()
    get bm() {
        return this._bm as Benchmark;
    }

    async setUp(): Promise<void> {
        let adapter = new ExpoSqliteAdapter();
        await adapter.init();
        this._bm = new Benchmark('op-sqlite', adapter);
    }

    async runAll(): Promise<BenchmarkResults> {
        await this.setUp();
        let result = await this.bm.runAll();
        return result;
    }
}