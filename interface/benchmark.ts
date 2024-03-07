class Benchmark {

    static async record(name: string, callback: () => Promise<void>) {
        let start = performance.now();
        await callback();
        let end = performance.now();
        console.log(`${name} time: ${end - start}ms`);
        // results.add(BenchmarkResult(name, stopwatch.elapsed));
        // print("$name :: ${stopwatch.elapsedMilliseconds}ms");
    }
}

export default Benchmark
