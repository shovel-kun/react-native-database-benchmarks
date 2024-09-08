import Benchmark, { BenchmarkBatched, BenchmarkResults } from '../interface/benchmark';
import { DBAdapter } from '../interface/db_adapter';
import * as FileSystem from 'expo-file-system';
import { StorageAccessFramework } from 'expo-file-system';

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
    let s = `,Test,${results.map((r) => r.suite).join(',')}\n`;
    let first: BenchmarkResults = results[0];
    for (let i = 0; i < first.results.length; i++) {
      let test = first.results[i].test;
      s += `,${test}`;
      for (const rr of results) {
        if (i < rr.results.length) {
          let r3 = rr.results[i].duration;
          s += `,${r3}`;
        } else {
          s += `,N/A`;
        }
      }
      s += '\n';
    }
    console.log(`Here are the results in CSV format:\n${s}`);
    await this.saveToFile('benchmark_results.csv', s);
  }

  private async saveToFile(filename: string, content: string) {
    const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
    if (!permissions.granted) {
      return;
    }

    try {
      await StorageAccessFramework.createFileAsync(permissions.directoryUri, filename, 'text/csv')
        .then(async (uri) => {
          await FileSystem.writeAsStringAsync(uri, content, { encoding: FileSystem.EncodingType.Base64 });
        })
        .catch((e) => {
          console.log(e);
          throw e;
        });
    } catch (e) {
      console.error('Error saving file:', e);
      throw e;
    }
  }
}
