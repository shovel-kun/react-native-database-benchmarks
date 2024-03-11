// class Benchmark {

import { assertAlways, numberName, randomIntFromInterval } from "../database/Utils";
import { DBAdapter } from "./db_adapter";

export class BenchmarkResult {
    test: string;
    duration: number;

    constructor(test: string, duration: number) {
        this.test = test;
        this.duration = duration;
    }

    toString(): string {
        return "$test: ${duration.inMilliseconds / 1000.0}s";
    }

    toCsv(): string {
        return "$test,${duration.inMilliseconds}";
    }
}

export class BenchmarkResults {
    suite: string;

    results: BenchmarkResult[] = [];

    constructor(suite: string) {
        this.suite = suite;
    }

    async record(name: string, callback: () => Promise<void>) {
        let start = performance.now();
        await callback();
        let end = performance.now();
        let duration = end - start;
        this.results.push(new BenchmarkResult(name, duration));
        console.log(`${name} :: ${duration}ms`);
    };


    toString(): string {
        return this.results.map((r) => r.toString()).join('\n');
    }

    toCsv(): string {
        return this.results.map((r) => r.toCsv()).join('\n');
    }
}

class Benchmark {
    name: string;
    dbAdapter: DBAdapter;

    constructor(name: string, dbAdapter: DBAdapter) {
        this.name = name;
        this.dbAdapter = dbAdapter;
    }

    async setUp(): Promise<void> {
        // this.dbAdapter.execute('DELETE FROM t1');
        // this.dbAdapter.execute('DELETE FROM t2');
        // this.dbAdapter.execute('DELETE FROM t3');

        this.dbAdapter.execute(
            'CREATE TABLE IF NOT EXISTS t1(id INTEGER PRIMARY KEY, a INTEGER, b INTEGER, c TEXT)');
        this.dbAdapter.execute(
            'CREATE TABLE IF NOT EXISTS t2(id INTEGER PRIMARY KEY, a INTEGER, b INTEGER, c TEXT)');

        this.dbAdapter.execute(
            'CREATE TABLE IF NOT EXISTS t3(id INTEGER PRIMARY KEY, a INTEGER, b INTEGER, c TEXT)');
        this.dbAdapter.execute('CREATE INDEX IF NOT EXISTS i3a ON t3(a)');
        this.dbAdapter.execute('CREATE INDEX IF NOT EXISTS i3b ON t3(b)');
    }

    async runAll(): Promise<BenchmarkResults> {
        let results: BenchmarkResults = new BenchmarkResults(this.name);

        await this.setUp();

        await results.record('Test 1: 1000 INSERTs', async () => {
            await this.test1();
        });
        await results.record('Test 2: 25000 INSERTs in a transaction', async () => {
            await this.test2();
        });
        await results.record('Test 3: 25000 INSERTs into an indexed table', async () => {
            await this.test3();
        });
        await results.record('Test 4: 100 SELECTs without an index', async () => {
            await this.test4();
        });
        await results.record('Test 5: 100 SELECTs on a string comparison', async () => {
            await this.test5();
        });
        await results.record('Test 7: 5000 SELECTs with an index', async () => {
            await this.test7();
        });
        await results.record('Test 8: 1000 UPDATEs without an index', async () => {
            await this.test8();
        });
        await results.record('Test 9: 25000 UPDATEs with an index', async () => {
            await this.test9();
        });
        await results.record('Test 10: 25000 text UPDATEs with an index', async () => {
            await this.test10();
        });
        await results.record('Test 11: INSERTs from a SELECT', async () => {
            await this.test11();
        });
        await results.record('Test 12: DELETE without an index', async () => {
            await this.test12();
        });
        await results.record('Test 13: DELETE with an index', async () => {
            await this.test13();
        });
        await results.record('Test 14: A big INSERT after a big DELETE', async () => {
            await this.test14();
        });
        await results.record('Test 15: A big DELETE followed by many small INSERTs', async () => {
            await this.test15();
        });
        await results.record('Test 16: Clear table', async () => {
            await this.test16();
        });

        await this.tearDown();
        return results;
    }

    /// Test 1: 1000 INSERTs
    async test1(): Promise<void> {
        for (let i = 0; i < 1000; i++) {
            const n = randomIntFromInterval(0, 100000);
            await this.dbAdapter.execute('INSERT INTO t1(a, b, c) VALUES(?, ?, ?)', [i + 1, n, numberName(n)]);
        }
        await this.dbAdapter.execute('PRAGMA wal_checkpoint(RESTART)');
    }
    /// Test 2: 25000 INSERTs in a transaction
    async test2(): Promise<void> {
        await this.dbAdapter.transaction(async tx => {
            for (let i = 0; i < 25000; ++i) {
                const n = randomIntFromInterval(0, 100000);
                await tx.execute(`INSERT INTO t2(a, b, c) VALUES(?, ?, ?)`, [i + 1, n, numberName(n)]);
            }
        });
        await this.dbAdapter.execute('PRAGMA wal_checkpoint(RESTART)');
    }
    /// Test 3: 25000 INSERTs into an indexed table
    async test3(): Promise<void> {
        await this.dbAdapter.transaction(async tx => {
            for (let i = 0; i < 25000; ++i) {
                const n = randomIntFromInterval(0, 100000);
                await tx.execute('INSERT INTO t3(a, b, c) VALUES(?, ?, ?)', [i + 1, n, numberName(n)]);
            }
        });
        await this.dbAdapter.execute('PRAGMA wal_checkpoint(RESTART)');
    }
    /// Test 4: 100 SELECTs without an index
    async test4(): Promise<void> {
        await this.dbAdapter.transaction(async tx => {
            for (let i = 0; i < 100; ++i) {
                const result = await tx.execute(
                    'SELECT count(*) count, avg(b) avg FROM t2 WHERE b>=? AND b<?',
                    [i * 100, i * 100 + 1000],
                );
                // console.log(JSON.stringify(result) + ' ' + i);
                // assertAlways(result.rows !== null && result.rows[0]['count'] > 200);
                // assertAlways(result.rows[0]['count'] < 300);
                // assertAlways(result.rows[0]['avg'] > i * 100);
                // assertAlways(result.rows[0]['avg'] < i * 100 + 1000);
            }
        });
    }
    /// Test 5: 100 SELECTs on a string comparison
    async test5(): Promise<void> {
        await this.dbAdapter.transaction(async tx => {
            for (let i = 0; i < 100; ++i) {
                const result = await tx.execute(
                    'SELECT count(*) count, avg(b) avg FROM t2 WHERE c LIKE ?',
                    [`%${numberName(i + 1)}%`]);
                // console.log(result.rows?._array);
                // assertAlways(result.rows?._array !== null);
                // assertAlways(result.rows!._array[0]['count'] > 400);
                // assertAlways(result.rows!._array[0]['count'] < 12000);
                // assertAlways(result.rows!._array[0]['avg'] > 30000);
            }
        });
    }

    /// Test 7: 5000 SELECTs with an index
    async test7(): Promise<void> {
        await this.dbAdapter.transaction(async tx => {
            for (let i = 0; i < 5000; ++i) {
                const result = await tx.execute(
                    'SELECT count(*) count, avg(b) avg FROM t3 WHERE b>=? AND b<?',
                    [i * 100, i * 100 + 100]);
                // if (i < 1000) {
                //     assertAlways(result.rows[0]['count'] > 10);
                //     assertAlways(result.rows[0]['count'] < 100);
                // } else {
                //     assertAlways(result.rows[0]['count'] === 0);
                // }
            }
        });
    }

    /// Test 8: 1000 UPDATEs without an index
    async test8(): Promise<void> {
        await this.dbAdapter.transaction(async tx => {
            for (let i = 0; i < 1000; ++i) {
                await tx.execute(
                    'UPDATE t1 SET b=b*2 WHERE a>=? AND a<?',
                    [i * 10, i * 10 + 10],
                );
            }
        });
    }

    /// Test 9: 25000 UPDATEs with an index
    async test9(): Promise<void> {
        await this.dbAdapter.transaction(async tx => {
            for (let i = 0; i < 25000; ++i) {
                const n = randomIntFromInterval(0, 100000);
                await tx.execute(
                    'UPDATE t3 SET b=? WHERE a=?',
                    [n, i + 1],
                );
            }
        });
    }

    /// Test 10: 25000 text UPDATEs with an index
    async test10(): Promise<void> {
        await this.dbAdapter.transaction(async tx => {
            for (let i = 0; i < 25000; ++i) {
                const n = randomIntFromInterval(0, 100000);
                await tx.execute(
                    'UPDATE t3 SET c=? WHERE a=?',
                    [numberName(n), i + 1],
                );
            }
        });
    }

    /// Test 11: INSERTs from a SELECT
    async test11(): Promise<void> {
        await this.dbAdapter.transaction(async tx => {
            await tx.execute('INSERT INTO t1(a, b, c) SELECT b,a,c FROM t3');
            await tx.execute('INSERT INTO t3(a, b, c) SELECT b,a,c FROM t1');
        });
    }

    /// Test 12: DELETE without an index
    async test12(): Promise<void> {
        await this.dbAdapter.execute("DELETE FROM t3 WHERE c LIKE '%fifty%'");
    }

    /// Test 13: DELETE with an index
    async test13(): Promise<void> {
        await this.dbAdapter.execute('DELETE FROM t3 WHERE a>10 AND a<20000');
    }

    /// Test 14: A big INSERT after a big DELETE
    async test14(): Promise<void> {
        await this.dbAdapter.execute('INSERT INTO t3(a, b, c) SELECT a, b, c FROM t1');
    }

    /// Test 15: A big DELETE followed by many small INSERTs
    async test15(): Promise<void> {
        await this.dbAdapter.transaction(async tx => {
            await tx.execute('DELETE FROM t1');
            for (let i = 0; i < 12000; ++i) {
                const n = randomIntFromInterval(0, 100000);
                await tx.execute(
                    'INSERT INTO t1(a, b, c) VALUES(?, ?, ?)',
                    [i + 1, n, numberName(n)],
                );
            }
        });
    }

    async test16(): Promise<void> {
        var row1 = await this.dbAdapter.execute('SELECT count() count FROM t1');
        var row2 = await this.dbAdapter.execute('SELECT count() count FROM t2');
        var row3 = await this.dbAdapter.execute('SELECT count() count FROM t3');
        // assertAlways(row1.rows[0]['count'] == 12000);
        // assertAlways(row2.rows[0]['count'] == 25000);
        // assertAlways(row3.rows[0]['count'] > 34000);
        // assertAlways(row3.rows[0]['count'] < 36000);

        await this.dbAdapter.execute('DELETE FROM t1');
        await this.dbAdapter.execute('DELETE FROM t2');
        await this.dbAdapter.execute('DELETE FROM t3');
        await this.dbAdapter.execute('PRAGMA wal_checkpoint(RESTART)');
    }

    async tearDown(): Promise<void> {
        await this.dbAdapter.close();
    }
}


export default Benchmark
