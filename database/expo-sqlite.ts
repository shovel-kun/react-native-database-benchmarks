import * as SQLite from 'expo-sqlite';
import { randomIntFromInterval, numberName, assertAlways } from './Utils';
import * as FileSystem from 'expo-file-system';
import Benchmark from '../interface/benchmark';

const DB_NAME = 'expo-sqlite';
const dir = FileSystem.documentDirectory;

let db: SQLite.SQLiteDatabase;

export async function setupDb() {
    const dbPath = dir + 'expo-sqlite.db';

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
    db = SQLite.openDatabase(dbPath);

    db.exec([{ sql: 'CREATE TABLE IF NOT EXISTS t1(id INTEGER PRIMARY KEY, a INTEGER, b INTEGER, c TEXT)', args: [] }], false, () => { });
    db.exec(
        [{ sql: 'CREATE TABLE IF NOT EXISTS t2(id INTEGER PRIMARY KEY, a INTEGER, b INTEGER, c TEXT)', args: [] }], false, () => { });

    db.exec([{ sql: 'CREATE TABLE IF NOT EXISTS t3(id INTEGER PRIMARY KEY, a INTEGER, b INTEGER, c TEXT)', args: [] }], false, () => { });
    db.exec([{ sql: 'CREATE INDEX IF NOT EXISTS i3a ON t3(a)', args: [] }], false, () => { });
    db.exec([{ sql: 'CREATE INDEX IF NOT EXISTS i3b ON t3(b)', args: [] }], false, () => { });
}

export async function runAllTestsExpo() {
    await setupDb();
    await Benchmark.record('Test 1', test1);
    await Benchmark.record('Test 2', test2);
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

// /// Test 3: 25000 INSERTs into an indexed table
// export async function test3() {
//     await db.transaction(async (tx: Transaction) => {
//         for (let i = 0; i < 25000; ++i) {
//             const n = randomIntFromInterval(0, 100000);
//             tx.execute('INSERT INTO t3(a, b, c) VALUES(?, ?, ?)', [i + 1, n, numberName(n)]);
//         }
//     });
//     db.execute('PRAGMA wal_checkpoint(RESTART)');
// }

// /// Test 4: 100 SELECTs without an index
// export async function test4() {
//     await db.transaction(async (tx: Transaction) => {
//         for (let i = 0; i < 100; ++i) {
//             const result: QueryResult = tx.execute(
//                 'SELECT count(*) count, avg(b) avg FROM t2 WHERE b>=? AND b<?',
//                 [i * 100, i * 100 + 1000],
//             );
//             assertAlways(result.rows?._array !== null && result.rows!._array[0]['count'] > 200);
//             assertAlways(result.rows!._array[0]['count'] < 300);
//             assertAlways(result.rows!._array[0]['avg'] > i * 100);
//             assertAlways(result.rows!._array[0]['avg'] < i * 100 + 1000);
//         }
//     });
// }

// /// Test 5: 100 SELECTs on a string comparison
// export async function test5() {
//     await db.transaction(async (tx: Transaction) => {
//         for (let i = 0; i < 100; ++i) {
//             const result = tx.execute(
//                 'SELECT count(*) count, avg(b) avg FROM t2 WHERE c LIKE ?',
//                 [`%${numberName(i + 1)}%`]);
//             // console.log(result.rows?._array);
//             // assertAlways(result.rows?._array !== null);
//             // assertAlways(result.rows!._array[0]['count'] > 400);
//             // assertAlways(result.rows!._array[0]['count'] < 12000);
//             // assertAlways(result.rows!._array[0]['avg'] > 30000);
//         }
//     });
// }

// /// Test 6: 5000 SELECTs with an index
// export async function test6() {
//     await db.transaction(async (tx: Transaction) => {
//         for (let i = 0; i < 5000; ++i) {
//             const result = tx.execute(
//                 'SELECT count(*) count, avg(b) avg FROM t3 WHERE b>=? AND b<?',
//                 [i * 100, i * 100 + 100]);
//             if (i < 1000) {
//                 assertAlways(result.rows!._array[0]['count'] > 10);
//                 assertAlways(result.rows!._array[0]['count'] < 100);
//             } else {
//                 assertAlways(result.rows!._array[0]['count'] === 0);
//             }
//         }
//     });
// }

// /// Test 8: 1000 UPDATEs without an index
// export async function test8() {
//     await db.transaction(async (tx: Transaction) => {
//         for (let i = 0; i < 1000; ++i) {
//             tx.execute(
//                 'UPDATE t1 SET b=b*2 WHERE a>=? AND a<?',
//                 [i * 10, i * 10 + 10],
//             );
//         }
//     });
// }

// /// Test 9: 25000 UPDATEs with an index
// export async function test9() {
//     await db.transaction(async (tx: Transaction) => {
//         for (let i = 0; i < 25000; ++i) {
//             const n = randomIntFromInterval(0, 100000);
//             tx.execute(
//                 'UPDATE t3 SET b=? WHERE a=?',
//                 [n, i + 1],
//             );
//         }
//     });
// }

// /// Test 10: 25000 text UPDATEs with an index
// export async function test10() {
//     await db.transaction(async (tx: Transaction) => {
//         for (let i = 0; i < 25000; ++i) {
//             const n = randomIntFromInterval(0, 100000);
//             tx.execute(
//                 'UPDATE t3 SET c=? WHERE a=?',
//                 [numberName(n), i + 1],
//             );
//         }
//     });
// }

// /// Test 11: INSERTs from a SELECT
// export async function test11() {
//     await db.transaction(async (tx: Transaction) => {
//         tx.execute('INSERT INTO t1(a, b, c) SELECT b,a,c FROM t3');
//         tx.execute('INSERT INTO t3(a, b, c) SELECT b,a,c FROM t1');
//     });
// }

// /// Test 12: DELETE without an index
// export async function test12() {
//     db.execute("DELETE FROM t3 WHERE c LIKE '%fifty%'");
// }

// /// Test 13: DELETE with an index
// export async function test13() {
//     db.execute('DELETE FROM t3 WHERE a>10 AND a<20000');
// }

// /// Test 14: A big INSERT after a big DELETE
// export async function test14() {
//     db.execute('INSERT INTO t3(a, b, c) SELECT a, b, c FROM t1');
// }

// /// Test 15: A big DELETE followed by many small INSERTs
// export async function test15() {
//     await db.transaction(async (tx: Transaction) => {
//         tx.execute('DELETE FROM t1');
//         for (let i = 0; i < 12000; ++i) {
//             const n = randomIntFromInterval(0, 100000);
//             tx.execute(
//                 'INSERT INTO t1(a, b, c) VALUES(?, ?, ?)',
//                 [i + 1, n, numberName(n)],
//             );
//         }
//     });
// }

// /// Test 16: Clear table
// export async function test16() {
//     var row1 = db.execute('SELECT count() count FROM t1');
//     var row2 = db.execute('SELECT count() count FROM t2');
//     var row3 = db.execute('SELECT count() count FROM t3');
//     assertAlways(row1.rows?._array[0]['count'] == 12000);
//     assertAlways(row2.rows?._array[0]['count'] == 25000);
//     assertAlways(row3.rows?._array[0]['count'] > 34000);
//     assertAlways(row3.rows?._array[0]['count'] < 36000);

//     db.execute('DELETE FROM t1');
//     db.execute('DELETE FROM t2');
//     db.execute('DELETE FROM t3');
//     db.execute('PRAGMA wal_checkpoint(RESTART)');
// }