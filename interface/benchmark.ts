import { assertAlways, numberName, randomIntFromInterval, roundToTwoDigits } from '../database/utils';
import { ClassNotImplementedError } from '../errors/errors';
import { DBAdapter, SQLBatchTuple } from './db_adapter';
import Chance from 'chance';

const chance = new Chance();

class BenchmarkResult {
  test: string;
  duration: number | string;

  constructor(test: string, duration: number | string) {
    this.test = test;
    this.duration = duration;
  }

  toString(): string {
    return `${this.test}: ${this.duration}ms`;
  }

  toCsv(): string {
    return `${this.test},${this.duration}`;
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
    try {
      await callback();
      let end = performance.now();
      let duration = end - start;
      let formattedDuration = roundToTwoDigits(duration);
      this.results.push(new BenchmarkResult(name, formattedDuration ?? ''));
      console.log(`${name} :: ${formattedDuration}ms`);
    } catch (err) {
      if (err instanceof ClassNotImplementedError) {
        this.results.push(new BenchmarkResult(name, 'N/A'));
        console.log(`${name} :: ${err.message}`);
      } else {
        this.results.push(new BenchmarkResult(name, 'N/A'));
        console.log(`${name} :: ${err}`);
      }
    }
  }

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

  async setUp(includeTest17: boolean): Promise<void> {
    await this.dbAdapter.init();

    await this.dbAdapter.execute('CREATE TABLE IF NOT EXISTS t1(id INTEGER PRIMARY KEY, a INTEGER, b INTEGER, c TEXT)');
    await this.dbAdapter.execute('CREATE TABLE IF NOT EXISTS t2(id INTEGER PRIMARY KEY, a INTEGER, b INTEGER, c TEXT)');
    await this.dbAdapter.execute('CREATE TABLE IF NOT EXISTS t3(id INTEGER PRIMARY KEY, a INTEGER, b INTEGER, c TEXT)');
    await this.dbAdapter.execute('CREATE INDEX IF NOT EXISTS i3a ON t3(a)');
    await this.dbAdapter.execute('CREATE INDEX IF NOT EXISTS i3b ON t3(b)');
    await this.dbAdapter.execute('CREATE TABLE IF NOT EXISTS json_table(id INTEGER PRIMARY KEY, json_data TEXT)');

    if (includeTest17) {
      console.log('Setting up database with 300K records, this might take a while...');
      //Setup 300k records
      await this.dbAdapter.execute(
        'CREATE TABLE Test (id INT PRIMARY KEY, v1 TEXT, v2 TEXT, v3 TEXT, v4 TEXT, v5 TEXT, v6 INT, v7 INT, v8 INT, v9 INT, v10 INT, v11 REAL, v12 REAL, v13 REAL, v14 REAL) STRICT;'
      );

      await this.dbAdapter.execute('PRAGMA mmap_size=268435456');

      await this.dbAdapter.transaction(async (tx) => {
        for (let i = 0; i < 300000; i++) {
          await tx.execute(
            'INSERT INTO "Test" (id, v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
              i,
              chance.name(),
              chance.name(),
              chance.name(),
              chance.name(),
              chance.name(),
              chance.integer(),
              chance.integer(),
              chance.integer(),
              chance.integer(),
              chance.integer(),
              chance.floating(),
              chance.floating(),
              chance.floating(),
              chance.floating()
            ]
          );
        }
      });
    }
  }

  /**
   * Runs all the benchmarks for the given database adapter.
   * includeTest17 is an optional parameter to include the 300k records setup and query.
   * Note: Test 17 is not included by default as it takes a long time to setup and run.
   * @param includeTest17
   * @returns the benchmark results
   */
  async runAll(includeTest17: boolean = false): Promise<BenchmarkResults> {
    let results: BenchmarkResults = new BenchmarkResults(this.name);

    console.log('Setting up database...');
    await this.setUp(includeTest17);
    console.log(`Setting up database ${this.name} done.`);

    console.log('Running tests...');
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
    if (includeTest17) {
      await results.record('Test 17: Query 300k records', async () => {
        await this.test17();
      });
    }
    // JSON tests with 1000 iterations
    await results.record('Test 18: 1000 JSON INSERTs', async () => {
      await this.testJsonInsert(1000);
    });
    await results.record('Test 19: 1000 JSON SELECTs', async () => {
      await this.testJsonSelect(1000);
    });
    await results.record('Test 20: 1000 JSON SELECTs + parsing', async () => {
      await this.testJsonSelectParse(1000);
    });

    // JSON tests with 5000 iterations
    await results.record('Test 21: 5000 JSON INSERTs', async () => {
      await this.testJsonInsert(5000);
    });
    await results.record('Test 22: 5000 JSON SELECTs', async () => {
      await this.testJsonSelect(5000);
    });
    await results.record('Test 23: 5000 JSON SELECTs + parsing', async () => {
      await this.testJsonSelectParse(5000);
    });

    // JSON tests with 25000 iterations
    await results.record('Test 24: 25000 JSON INSERTs', async () => {
      await this.testJsonInsert(25000);
    });
    await results.record('Test 25: 25000 JSON SELECTs', async () => {
      await this.testJsonSelect(25000);
    });
    await results.record('Test 26: 25000 JSON SELECTs + parsing', async () => {
      await this.testJsonSelectParse(25000);
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
    await this.dbAdapter.transaction(async (tx) => {
      for (let i = 0; i < 25000; ++i) {
        const n = randomIntFromInterval(0, 100000);
        await tx.execute(`INSERT INTO t2(a, b, c) VALUES(?, ?, ?)`, [i + 1, n, numberName(n)]);
      }
    });
    await this.dbAdapter.execute('PRAGMA wal_checkpoint(RESTART)');
  }
  /// Test 3: 25000 INSERTs into an indexed table
  async test3(): Promise<void> {
    await this.dbAdapter.transaction(async (tx) => {
      for (let i = 0; i < 25000; ++i) {
        const n = randomIntFromInterval(0, 100000);
        await tx.execute('INSERT INTO t3(a, b, c) VALUES(?, ?, ?)', [i + 1, n, numberName(n)]);
      }
    });
    await this.dbAdapter.execute('PRAGMA wal_checkpoint(RESTART)');
  }
  /// Test 4: 100 SELECTs without an index
  async test4(): Promise<void> {
    await this.dbAdapter.transaction(async (tx) => {
      for (let i = 0; i < 100; ++i) {
        await tx.execute('SELECT count(*) count, avg(b) avg FROM t2 WHERE b>=? AND b<?', [i * 100, i * 100 + 1000]);
      }
    });
  }
  /// Test 5: 100 SELECTs on a string comparison
  async test5(): Promise<void> {
    await this.dbAdapter.transaction(async (tx) => {
      for (let i = 0; i < 100; ++i) {
        const result = await tx.execute('SELECT count(*) count, avg(b) avg FROM t2 WHERE c LIKE ?', [
          `%${numberName(i + 1)}%`
        ]);
      }
    });
  }

  /// Test 7: 5000 SELECTs with an index
  async test7(): Promise<void> {
    await this.dbAdapter.transaction(async (tx) => {
      for (let i = 0; i < 5000; ++i) {
        const result = await tx.execute('SELECT count(*) count, avg(b) avg FROM t3 WHERE b>=? AND b<?', [
          i * 100,
          i * 100 + 100
        ]);
      }
    });
  }

  /// Test 8: 1000 UPDATEs without an index
  async test8(): Promise<void> {
    await this.dbAdapter.transaction(async (tx) => {
      for (let i = 0; i < 1000; ++i) {
        await tx.execute('UPDATE t1 SET b=b*2 WHERE a>=? AND a<?', [i * 10, i * 10 + 10]);
      }
    });
    await this.dbAdapter.execute('PRAGMA wal_checkpoint(RESTART)');
  }

  /// Test 9: 25000 UPDATEs with an index
  async test9(): Promise<void> {
    await this.dbAdapter.transaction(async (tx) => {
      for (let i = 0; i < 25000; ++i) {
        const n = randomIntFromInterval(0, 100000);
        await tx.execute('UPDATE t3 SET b=? WHERE a=?', [n, i + 1]);
      }
    });
    await this.dbAdapter.execute('PRAGMA wal_checkpoint(RESTART)');
  }

  /// Test 10: 25000 text UPDATEs with an index
  async test10(): Promise<void> {
    await this.dbAdapter.transaction(async (tx) => {
      for (let i = 0; i < 25000; ++i) {
        const n = randomIntFromInterval(0, 100000);
        await tx.execute('UPDATE t3 SET c=? WHERE a=?', [numberName(n), i + 1]);
      }
    });
  }

  /// Test 11: INSERTs from a SELECT
  async test11(): Promise<void> {
    await this.dbAdapter.transaction(async (tx) => {
      await tx.execute('INSERT INTO t1(a, b, c) SELECT b,a,c FROM t3');
      await tx.execute('INSERT INTO t3(a, b, c) SELECT b,a,c FROM t1');
    });
    await this.dbAdapter.execute('PRAGMA wal_checkpoint(RESTART)');
  }

  /// Test 12: DELETE without an index
  async test12(): Promise<void> {
    await this.dbAdapter.execute("DELETE FROM t3 WHERE c LIKE '%fifty%'");
    await this.dbAdapter.execute('PRAGMA wal_checkpoint(RESTART)');
  }

  /// Test 13: DELETE with an index
  async test13(): Promise<void> {
    await this.dbAdapter.execute('DELETE FROM t3 WHERE a>10 AND a<20000');
    await this.dbAdapter.execute('PRAGMA wal_checkpoint(RESTART)');
  }

  /// Test 14: A big INSERT after a big DELETE
  async test14(): Promise<void> {
    await this.dbAdapter.execute('INSERT INTO t3(a, b, c) SELECT a, b, c FROM t1');
    await this.dbAdapter.execute('PRAGMA wal_checkpoint(RESTART)');
  }

  /// Test 15: A big DELETE followed by many small INSERTs
  async test15(): Promise<void> {
    await this.dbAdapter.transaction(async (tx) => {
      await tx.execute('DELETE FROM t1');
      for (let i = 0; i < 12000; ++i) {
        const n = randomIntFromInterval(0, 100000);
        await tx.execute('INSERT INTO t1(a, b, c) VALUES(?, ?, ?)', [i + 1, n, numberName(n)]);
      }
    });
    await this.dbAdapter.execute('PRAGMA wal_checkpoint(RESTART)');
  }

  /// Test 16: Clear table
  async test16(): Promise<void> {
    var row1 = await this.dbAdapter.execute('SELECT count() count FROM t1');
    var row2 = await this.dbAdapter.execute('SELECT count() count FROM t2');
    var row3 = await this.dbAdapter.execute('SELECT count() count FROM t3');

    await this.dbAdapter.execute('DELETE FROM t1');
    await this.dbAdapter.execute('DELETE FROM t2');
    await this.dbAdapter.execute('DELETE FROM t3');
    await this.dbAdapter.execute('PRAGMA wal_checkpoint(RESTART)');
  }

  async test17(): Promise<void> {
    await this.dbAdapter.execute('SELECT * FROM Test;');
  }

  async testJsonInsert(count: number): Promise<void> {
    await this.dbAdapter.transaction(async (tx) => {
      for (let i = 0; i < count; i++) {
        const jsonData = { name: `John Doe ${i}`, age: 30 + (i % 50), city: 'New York' };
        await tx.execute('INSERT INTO json_table(json_data) VALUES(?)', [JSON.stringify(jsonData)]);
      }
    });
    await this.dbAdapter.execute('PRAGMA wal_checkpoint(RESTART)');
  }

  async testJsonSelect(count: number): Promise<void> {
    await this.dbAdapter.transaction(async (tx) => {
      for (let i = 0; i < count; i++) {
        const result = await tx.execute('SELECT json_data FROM json_table WHERE id = ?', [(i % 1000) + 1]);
        if (result && result.rows && result.rows.length > 0 && result.rows[0].json_data) {
          JSON.parse(result.rows[0].json_data);
        }
      }
    });
  }

  async testJsonSelectParse(count: number): Promise<void> {
    await this.dbAdapter.transaction(async (tx) => {
      for (let i = 0; i < count; i++) {
        const result = await tx.execute('SELECT json_data FROM json_table WHERE id = ?', [i + 1]);
        if (result && result.rows && result.rows.length > 0 && result.rows[0].json_data) {
          JSON.parse(result.rows[0].json_data);
        }
      }
    });
  }

  async tearDown(): Promise<void> {
    await this.dbAdapter.execute('DROP TABLE IF EXISTS t1');
    await this.dbAdapter.execute('DROP TABLE IF EXISTS t2');
    await this.dbAdapter.execute('DROP TABLE IF EXISTS t3');
    await this.dbAdapter.execute('DROP TABLE IF EXISTS Test');
    await this.dbAdapter.execute('DROP TABLE IF EXISTS json_table');

    await this.dbAdapter.close();
  }
}

export class BenchmarkBatched extends Benchmark {
  constructor(name: string, dbAdapter: DBAdapter) {
    super(name, dbAdapter);
  }

  /**
   * Runs all the benchmarks for the given database adapter.
   * includeTest17 is an optional parameter to include the 300k records setup and query.
   * Note: Test 17 is not included by default as it takes a long time to setup and run.
   * @param includeTest17
   * @returns the benchmark results
   */
  async runAll(includeTest17: boolean = false): Promise<BenchmarkResults> {
    let results: BenchmarkResults = new BenchmarkResults(this.name);

    console.log('Setting up database for batching...');
    await super.setUp(includeTest17);
    console.log(`Setting up database ${this.name} for batching done.`);

    console.log('Running batch tests...');
    await results.record('Test 1: 1000 INSERTs', async () => {
      await super.test1();
    });
    await results.record('Test 2: 25000 INSERTs in a transaction', async () => {
      await this.test2();
    });
    await results.record('Test 3: 25000 INSERTs into an indexed table', async () => {
      await this.test3();
    });
    await results.record('Test 4: 100 SELECTs without an index', async () => {
      await super.test4();
    });
    await results.record('Test 5: 100 SELECTs on a string comparison', async () => {
      await super.test5();
    });
    await results.record('Test 7: 5000 SELECTs with an index', async () => {
      await super.test7();
    });
    await results.record('Test 8: 1000 UPDATEs without an index', async () => {
      await super.test8();
    });
    await results.record('Test 9: 25000 UPDATEs with an index', async () => {
      await this.test9();
    });
    await results.record('Test 10: 25000 text UPDATEs with an index', async () => {
      await this.test10();
    });
    await results.record('Test 11: INSERTs from a SELECT', async () => {
      await super.test11();
    });
    await results.record('Test 12: DELETE without an index', async () => {
      await super.test12();
    });
    await results.record('Test 13: DELETE with an index', async () => {
      await super.test13();
    });
    await results.record('Test 14: A big INSERT after a big DELETE', async () => {
      await super.test14();
    });
    await results.record('Test 15: A big DELETE followed by many small INSERTs', async () => {
      await this.test15();
    });
    await results.record('Test 16: Clear table', async () => {
      await super.test16();
    });
    if (includeTest17) {
      await results.record('Test 17: Query 300k records', async () => {
        await super.test17();
      });
    }
    await results.record('Test 18: 1000 JSON INSERTs', async () => {
      await this.testJsonInsert(1000);
    });
    await results.record('Test 19: 1000 JSON SELECTs', async () => {
      await this.testJsonSelect(1000);
    });
    await results.record('Test 20: 1000 JSON SELECTs + parsing', async () => {
      await this.testJsonSelectParse(1000);
    });
    await results.record('Test 21: 5000 JSON INSERTs', async () => {
      await this.testJsonInsert(5000);
    });
    await results.record('Test 22: 5000 JSON SELECTs', async () => {
      await this.testJsonSelect(5000);
    });
    await results.record('Test 23: 5000 JSON SELECTs + parsing', async () => {
      await this.testJsonSelectParse(5000);
    });
    await results.record('Test 24: 25000 JSON INSERTs', async () => {
      await this.testJsonInsert(25000);
    });
    await results.record('Test 25: 25000 JSON SELECTs', async () => {
      await this.testJsonSelect(25000);
    });
    await results.record('Test 26: 25000 JSON SELECTs + parsing', async () => {
      await this.testJsonSelectParse(25000);
    });

    await super.tearDown();
    return results;
  }
  /// Test 2: 25000 INSERTs in a transaction
  async test2(): Promise<void> {
    let params: SQLBatchTuple[] = [];
    const query = `INSERT INTO t2(a, b, c) VALUES(?, ?, ?)`;
    for (let i = 0; i < 25000; ++i) {
      const n = randomIntFromInterval(0, 100000);
      params.push([query, [i + 1, n, numberName(n)]]);
    }
    await this.dbAdapter.executeBatch(params);
    await this.dbAdapter.execute('PRAGMA wal_checkpoint(RESTART)');
  }
  /// Test 3: 25000 INSERTs into an indexed table
  async test3(): Promise<void> {
    let params: SQLBatchTuple[] = [];
    const query = `INSERT INTO t3(a, b, c) VALUES(?, ?, ?)`;
    for (let i = 0; i < 25000; ++i) {
      const n = randomIntFromInterval(0, 100000);
      params.push([query, [i + 1, n, numberName(n)]]);
    }
    await this.dbAdapter.executeBatch(params);
    await this.dbAdapter.execute('PRAGMA wal_checkpoint(RESTART)');
  }

  /// Test 9: 25000 UPDATEs with an index
  async test9(): Promise<void> {
    let params: SQLBatchTuple[] = [];
    const query = `UPDATE t3 SET b=? WHERE a=?`;
    for (let i = 0; i < 25000; ++i) {
      const n = randomIntFromInterval(0, 100000);
      params.push([query, [n, i + 1]]);
    }
    await this.dbAdapter.executeBatch(params);
    await this.dbAdapter.execute('PRAGMA wal_checkpoint(RESTART)');
  }

  /// Test 10: 25000 text UPDATEs with an index
  async test10(): Promise<void> {
    let params: SQLBatchTuple[] = [];
    const query = `UPDATE t3 SET c=? WHERE a=?`;
    for (let i = 0; i < 25000; ++i) {
      const n = randomIntFromInterval(0, 100000);
      params.push([query, [numberName(n), i + 1]]);
    }
    await this.dbAdapter.executeBatch(params);
    await this.dbAdapter.execute('PRAGMA wal_checkpoint(RESTART)');
  }

  /// Test 15: A big DELETE followed by many small INSERTs
  async test15(): Promise<void> {
    await this.dbAdapter.execute('DELETE FROM t1');
    let params: SQLBatchTuple[] = [];
    const query = `INSERT INTO t1(a, b, c) VALUES(?, ?, ?)`;
    for (let i = 0; i < 25000; ++i) {
      const n = randomIntFromInterval(0, 100000);
      params.push([query, [i + 1, n, numberName(n)]]);
    }
    await this.dbAdapter.executeBatch(params);
    await this.dbAdapter.execute('PRAGMA wal_checkpoint(RESTART)');
  }

  async testJsonInsert(count: number): Promise<void> {
    let params: SQLBatchTuple[] = [];
    const query = `INSERT INTO json_table(json_data) VALUES(?)`;

    for (let i = 0; i < count; i++) {
      const jsonData = { name: `John Doe ${i}`, age: 30 + (i % 50), city: 'New York' };
      params.push([query, [JSON.stringify(jsonData)]]);
    }

    await this.dbAdapter.executeBatch(params);
    await this.dbAdapter.execute('PRAGMA wal_checkpoint(RESTART)');
  }

  async testJsonSelect(count: number): Promise<void> {
    const batchSize = 5000;
    const batches = Math.ceil(count / batchSize);

    for (let i = 0; i < batches; i++) {
      const query = `SELECT json_data FROM json_table WHERE id > ? AND id <= ?`;
      const startId = i * batchSize;
      const endId = Math.min((i + 1) * batchSize, count);

      await this.dbAdapter.execute(query, [startId, endId]);
    }
  }

  async testJsonSelectParse(count: number): Promise<void> {
    const batchSize = 5000;
    const batches = Math.ceil(count / batchSize);

    for (let i = 0; i < batches; i++) {
      const query = `SELECT json_data FROM json_table WHERE id > ? AND id <= ?`;
      const startId = i * batchSize;
      const endId = Math.min((i + 1) * batchSize, count);

      const results = await this.dbAdapter.execute(query, [startId, endId]);

      for (const row of results.rows) {
        if (row && row.json_data) {
          JSON.parse(row.json_data);
        }
      }
    }
  }
}

export default Benchmark;
