import Benchmark, { BenchmarkResults } from '../interface/benchmark';
import { OPSqliteAdapter } from '../adapters/op-sqlite-adapter';

export class OPSqlite {
    private _bm: Benchmark | null;

    constructor() {
        this._bm = null;
    }

    // Only to be used after setUp()
    get bm() {
        return this._bm as Benchmark;
    }

    async setUp(): Promise<void> {
        let adapter = new OPSqliteAdapter();
        await adapter.init();
        this._bm = new Benchmark('op-sqlite', adapter);
    }

    async runAll(): Promise<BenchmarkResults> {
        await this.setUp();
        let result = await this.bm.runAll();
        return result;
    }
}