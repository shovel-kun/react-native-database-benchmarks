import Benchmark, { BenchmarkBatched } from "../interface/benchmark";
import { DBAdapter } from "../interface/db_adapter";

export class BenchmarkSuite {
    benchmarks: { name: string, dbAdapter: DBAdapter }[];

    constructor(benchmarks: { name: string, dbAdapter: DBAdapter }[]) {
        this.benchmarks = benchmarks;
    }

    async runBenchmarks() {
        for (const benchmark of this.benchmarks) {
            let bm = new Benchmark(benchmark.name, benchmark.dbAdapter);
            await bm.runAll();
        }
    }

    async runBatchedBenchmarks() {
        for (const benchmark of this.benchmarks) {
            let bm = new BenchmarkBatched(benchmark.name, benchmark.dbAdapter);
            await bm.runAll();
        }
    }
}