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
        return new BenchmarkResults('');
    }
}

export async function setupDb() {
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

    console.log(`Setup db`);
    db = SQLite.openDatabase(DB_NAME);

    // db.exec([{ sql: 'CREATE TABLE t1(id INTEGER PRIMARY KEY, a INTEGER, b INTEGER, c TEXT)', args: [] }], false, () => { });
    // db.exec(
    //     [{ sql: 'CREATE TABLE t2(id INTEGER PRIMARY KEY, a INTEGER, b INTEGER, c TEXT)', args: [] }], false, () => { });
    // db.exec([{ sql: 'CREATE TABLE t3(id INTEGER PRIMARY KEY, a INTEGER, b INTEGER, c TEXT)', args: [] }], false, () => { });
    // db.exec([{ sql: 'CREATE INDEX IF NOT EXISTS i3a ON t3(a)', args: [] }], false, () => { });
    // db.exec([{ sql: 'CREATE INDEX IF NOT EXISTS i3b ON t3(b)', args: [] }], false, () => { });

    await db.execAsync([{ sql: 'CREATE TABLE t1(id INTEGER PRIMARY KEY, a INTEGER, b INTEGER, c TEXT)', args: [] }], false);
    await db.execAsync(
        [{ sql: 'CREATE TABLE t2(id INTEGER PRIMARY KEY, a INTEGER, b INTEGER, c TEXT)', args: [] }], false);
    await db.execAsync([{ sql: 'CREATE TABLE t3(id INTEGER PRIMARY KEY, a INTEGER, b INTEGER, c TEXT)', args: [] }], false);
}

export async function runAllTestsExpo() {
    await setupDb();
    // await Benchmark.record('Test 1', test1);
    // await Benchmark.record('Test 2', test2);
    // await Benchmark.record('Test 3', test3);
    // await Benchmark.record('Test 4', test4);
    // await Benchmark.record('Test 5', test5);
    // await Benchmark.record('Test 6', test6);
    // await Benchmark.record('Test 8', test8);
    // await Benchmark.record('Test 9', test9);
}

/// Test 1: 1000 INSERTs
export async function test1() {
    for (let i = 0; i < 1000; i++) {
        const n = randomIntFromInterval(0, 100000);
        db.exec([{ sql: 'INSERT INTO t1(a, b, c) VALUES(?, ?, ?)', args: [i + 1, n, numberName(n)] }], false, () => { });
    }
    db.exec([{ sql: 'PRAGMA wal_checkpoint(RESTART)', args: [] }], false, () => { });
}

/// Test 2: 25000 INSERTs in a transaction
export async function test2() {
    await db.transactionAsync(async tx => {
        for (let i = 0; i < 25000; ++i) {
            const n = randomIntFromInterval(0, 100000);
            await tx.executeSqlAsync(`INSERT INTO t2(a, b, c) VALUES(?, ?, ?)`, [i + 1, n, numberName(n)]);
        }
    });
    db.exec([{ sql: 'PRAGMA wal_checkpoint(RESTART)', args: [] }], false, () => { });
}

/// Test 3: 25000 INSERTs into an indexed table
export async function test3() {
    await db.transactionAsync(async tx => {
        for (let i = 0; i < 25000; ++i) {
            const n = randomIntFromInterval(0, 100000);
            tx.executeSqlAsync('INSERT INTO t3(a, b, c) VALUES(?, ?, ?)', [i + 1, n, numberName(n)]);
        }
    });
    db.exec([{ sql: 'PRAGMA wal_checkpoint(RESTART)', args: [] }], false, () => { });
}

/// Test 4: 100 SELECTs without an index
export async function test4() {
    await db.transactionAsync(async tx => {
        for (let i = 0; i < 100; ++i) {
            const result = await tx.executeSqlAsync(
                'SELECT count(*) count, avg(b) avg FROM t2 WHERE b>=? AND b<?',
                [i * 100, i * 100 + 1000],
            );
            assertAlways(result.rows !== null && result.rows[0]['count'] > 200);
            assertAlways(result.rows[0]['count'] < 300);
            assertAlways(result.rows[0]['avg'] > i * 100);
            assertAlways(result.rows[0]['avg'] < i * 100 + 1000);
        }
    });
}

/// Test 5: 100 SELECTs on a string comparison
export async function test5() {
    await db.transactionAsync(async tx => {
        for (let i = 0; i < 100; ++i) {
            const result = await tx.executeSqlAsync(
                'SELECT count(*) count, avg(b) avg FROM t2 WHERE c LIKE ?',
                [`%${numberName(i + 1)}%`]);
            // console.log(result.rows);
            // assertAlways(result.rows !== null);
            // assertAlways(result.rows[0]['count'] > 400);
            // assertAlways(result.rows[0]['count'] < 12000);
            // assertAlways(result.rows[0]['avg'] > 30000);
        }
    });
}

/// Test 6: 5000 SELECTs with an index
export async function test6() {
    await db.transactionAsync(async tx => {
        for (let i = 0; i < 5000; ++i) {
            const result = await tx.executeSqlAsync(
                'SELECT count(*) count, avg(b) avg FROM t3 WHERE b>=? AND b<?',
                [i * 100, i * 100 + 100]);
            if (i < 1000) {
                assertAlways(result.rows[0]['count'] > 10);
                assertAlways(result.rows[0]['count'] < 100);
            } else {
                assertAlways(result.rows[0]['count'] === 0);
            }
        }
    });
}

/// Test 8: 1000 UPDATEs without an index
export async function test8() {
    await db.transactionAsync(async tx => {
        for (let i = 0; i < 1000; ++i) {
            await tx.executeSqlAsync(
                'UPDATE t1 SET b=b*2 WHERE a>=? AND a<?',
                [i * 10, i * 10 + 10],
            );
        }

    });
}

/// Test 9: 25000 UPDATEs with an index
export async function test9() {
    await db.transactionAsync(async tx => {
        for (let i = 0; i < 25000; ++i) {
            const n = randomIntFromInterval(0, 100000);
            await tx.executeSqlAsync(
                'UPDATE t3 SET b=? WHERE a=?',
                [n, i + 1],
            );
        }
    });
}

/// Test 10: 25000 text UPDATEs with an index
export async function test10() {
    await db.transactionAsync(async tx => {
        for (let i = 0; i < 25000; ++i) {
            const n = randomIntFromInterval(0, 100000);
            await tx.executeSqlAsync(
                'UPDATE t3 SET c=? WHERE a=?',
                [numberName(n), i + 1],
            );
        }
    });
}

/// Test 11: INSERTs from a SELECT
export async function test11() {
    await db.transactionAsync(async tx => {
        await tx.executeSqlAsync('INSERT INTO t1(a, b, c) SELECT b,a,c FROM t3');
        await tx.executeSqlAsync('INSERT INTO t3(a, b, c) SELECT b,a,c FROM t1');
    });
}

/// Test 12: DELETE without an index
export async function test12() {
    db.exec([{ sql: "DELETE FROM t3 WHERE c LIKE '%fifty%'", args: [] }], false, () => { });
}

/// Test 13: DELETE with an index
export async function test13() {
    db.exec([{ sql: 'DELETE FROM t3 WHERE a>10 AND a<20000', args: [] }], false, () => { });
}

/// Test 14: A big INSERT after a big DELETE
export async function test14() {
    db.exec([{ sql: 'INSERT INTO t3(a, b, c) SELECT a, b, c FROM t1', args: [] }], false, () => { });
}

/// Test 15: A big DELETE followed by many small INSERTs
export async function test15() {
    await db.transactionAsync(async tx => {
        await tx.executeSqlAsync('DELETE FROM t1');
        for (let i = 0; i < 12000; ++i) {
            const n = randomIntFromInterval(0, 100000);
            await tx.executeSqlAsync(
                'INSERT INTO t1(a, b, c) VALUES(?, ?, ?)',
                [i + 1, n, numberName(n)],
            );
        }
    });
}

/// Test 16: Clear table
export async function test16() {
    let result1 = await db.execAsync([{ sql: 'SELECT count() count FROM t1', args: [] }], false);

    var t1 = result1[0];
    if (isResultSetError(t1)) {
        throw t1.error;
    }
    if (isResultSet(t1)) {
        assertAlways(t1.rows[0]['count'] == 12000);
    }
    var row2 = db.exec([{ sql: 'SELECT count() count FROM t2', args: [] }], true, () => { });
    var row3 = db.exec([{ sql: 'SELECT count() count FROM t3', args: [] }], true, () => { });

    // assertAlways(row2.rows?._array[0]['count'] == 25000);
    // assertAlways(row3.rows?._array[0]['count'] > 34000);
    // assertAlways(row3.rows?._array[0]['count'] < 36000);

    // db.execute('DELETE FROM t1');
    // db.execute('DELETE FROM t2');
    // db.execute('DELETE FROM t3');
    // db.execute('PRAGMA wal_checkpoint(RESTART)');
}

function isResultSet(result: SQLite.ResultSetError | SQLite.ResultSet): result is SQLite.ResultSet {
    return (result as SQLite.ResultSet).rows !== undefined;
}

function isResultSetError(result: SQLite.ResultSetError | SQLite.ResultSet): result is SQLite.ResultSetError {
    return (result as SQLite.ResultSetError).error !== undefined;
}