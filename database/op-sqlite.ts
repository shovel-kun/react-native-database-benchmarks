import { Transaction, open } from '@op-engineering/op-sqlite';
import Utils from './Utils';

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
    let start = performance.now();
    for (var i = 0; i < 1000; i++) {
        let n = Utils.randomIntFromInterval(0, 100000);
        db.execute('INSERT INTO t1(a, b, c) VALUES(?, ?, ?)', [i + 1, n, Utils.numberName(n)]);
    }
    db.execute('PRAGMA wal_checkpoint(RESTART)');
    let end = performance.now();
    console.log(`Test 1 time: ${end - start}ms`);
}

/// Test 2: 25000 INSERTs in a transaction
export async function test2() {
    let start = performance.now();
    await db.transaction(async (tx: Transaction) => {
        for (var i = 0; i < 25000; ++i) {
            let n = Utils.randomIntFromInterval(0, 100000);
            tx.execute(`INSERT INTO t2(a, b, c) VALUES(?, ?, ?)`, [i + 1, n, Utils.numberName(n)]);
        }
    });
    await db.execute('PRAGMA wal_checkpoint(RESTART)');
    let end = performance.now();
    console.log(`Test 2 time: ${end - start}ms`);
}

/// Test 3: 25000 INSERTs into an indexed table
export async function test3() {
    let start = performance.now();
    await db.transaction(async (tx: Transaction) => {
        for (var i = 0; i < 25000; ++i) {
            let n = Utils.randomIntFromInterval(0, 100000);
            tx.execute('INSERT INTO t3(a, b, c) VALUES(?, ?, ?)', [i + 1, n, Utils.numberName(n)]);
        }
    });
    await db.execute('PRAGMA wal_checkpoint(RESTART)');
    let end = performance.now();
    console.log(`Test 3 time: ${end - start}ms`);
}