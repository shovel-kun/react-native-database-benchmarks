import Benchmark, { BenchmarkBatched, BenchmarkResults } from '../interface/benchmark';
import { DBAdapter } from '../interface/db_adapter';

export class BenchmarkSuite {
  benchmarks: { name: string; dbAdapter: DBAdapter }[];

  constructor(benchmarks: { name: string; dbAdapter: DBAdapter }[]) {
    this.benchmarks = benchmarks;
  }

  async runBenchmarks() {
    let results = [];
    for (const benchmark of this.benchmarks) {
      let bm = new Benchmark(benchmark.name, benchmark.dbAdapter);
      results.push(await bm.runAll());
      let bmb = new BenchmarkBatched(`${benchmark.name}-batched`, benchmark.dbAdapter);
      results.push(await bmb.runAll());
    }
    console.log('');
    let s = ',Test';
    for (const result of results) {
      s += `,${result.suite}`;
    }
    console.log(s);
    let first: BenchmarkResults = results[0];
    for (let i = 0; i < first.results.length; i++) {
      let test = first.results[i].test;
      let s = `,${test}`;
      for (const rr of results) {
        let r3 = rr.results[i].duration;
        s += `,${r3}`;
      }
      console.log(s);
    }
  }
}
