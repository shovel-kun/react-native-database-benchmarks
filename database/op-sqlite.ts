import { QueryResult, Transaction, open } from '@op-engineering/op-sqlite';
import { randomIntFromInterval, numberName, assertAlways } from './Utils';

const ROWS = 300000;
const DB_NAME = 'op-sqlite';
const DB_CONFIG = {
    name: DB_NAME,
};

let db: any;

export async function setupDb() {
    console.log(`Setup db`);
    db = open(DB_CONFIG);

    db.execute('DROP TABLE IF EXISTS t1;');
    db.execute('DROP TABLE IF EXISTS t2;');
    db.execute('DROP TABLE IF EXISTS t3;');

    db.execute(
        'CREATE TABLE t1(id INTEGER PRIMARY KEY, a INTEGER, b INTEGER, c TEXT)');
    db.execute(
        'CREATE TABLE t2(id INTEGER PRIMARY KEY, a INTEGER, b INTEGER, c TEXT)');

    db.execute(
        'CREATE TABLE t3(id INTEGER PRIMARY KEY, a INTEGER, b INTEGER, c TEXT)');
    db.execute('CREATE INDEX i3a ON t3(a)');
    db.execute('CREATE INDEX i3b ON t3(b)');
}

/// Test 1: 1000 INSERTs
export async function test1() {
    for (let i = 0; i < 1000; i++) {
        const n = randomIntFromInterval(0, 100000);
        db.execute('INSERT INTO t1(a, b, c) VALUES(?, ?, ?)', [i + 1, n, numberName(n)]);
    }
    db.execute('PRAGMA wal_checkpoint(RESTART)');
}

/// Test 2: 25000 INSERTs in a transaction
export async function test2() {
    await db.transaction(async (tx: Transaction) => {
        for (let i = 0; i < 25000; ++i) {
            const n = randomIntFromInterval(0, 100000);
            tx.execute(`INSERT INTO t2(a, b, c) VALUES(?, ?, ?)`, [i + 1, n, numberName(n)]);
        }
    });
    await db.execute('PRAGMA wal_checkpoint(RESTART)');
}

/// Test 3: 25000 INSERTs into an indexed table
export async function test3() {
    await db.transaction(async (tx: Transaction) => {
        for (let i = 0; i < 25000; ++i) {
            const n = randomIntFromInterval(0, 100000);
            tx.execute('INSERT INTO t3(a, b, c) VALUES(?, ?, ?)', [i + 1, n, numberName(n)]);
        }
    });
    await db.execute('PRAGMA wal_checkpoint(RESTART)');
}

/// Test 4: 100 SELECTs without an index
export async function test4() {
    await db.transaction(async (tx: Transaction) => {
        for (let i = 0; i < 100; ++i) {
            const result: QueryResult = tx.execute(
                'SELECT count(*) count, avg(b) avg FROM t2 WHERE b>=? AND b<?',
                [i * 100, i * 100 + 1000],
            );
            assertAlways(result.rows?._array !== null && result.rows!._array[0]['count'] > 200);
            assertAlways(result.rows!._array[0]['count'] < 300);
            assertAlways(result.rows!._array[0]['avg'] > i * 100);
            assertAlways(result.rows!._array[0]['avg'] < i * 100 + 1000);
        }
    });
}

/// Test 5: 100 SELECTs on a string comparison
export async function test5() {
    await db.transaction(async (tx: Transaction) => {
        for (let i = 0; i < 100; ++i) {
            const result = tx.execute(
                'SELECT count(*) count, avg(b) avg FROM t2 WHERE c LIKE ?',
                [`%${numberName(i + 1)}%`]);
            console.log(result.rows?._array);
            assertAlways(result.rows!._array[0]['count'] > 400);
            assertAlways(result.rows!._array[0]['count'] < 12000);
            assertAlways(result.rows!._array[0]['avg'] > 30000);
        }
    });
}
