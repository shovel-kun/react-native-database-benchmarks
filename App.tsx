import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { BenchmarkSuite } from './database/benchmark-suite';
import { OPSqliteAdapter, ExpoSqliteAdapter, PowersyncSqliteAdapter } from './adapters/adapters';


export default function App() {
  useEffect(() => {
    const runTests = async () => {
      try {
        let opSqliteAdapter = new OPSqliteAdapter();
        let expoSqliteAdapter = new ExpoSqliteAdapter();
        let psSqliteAdapter = new PowersyncSqliteAdapter();
        let benchmarks = [
          { 'name': 'op-sqlite', 'dbAdapter': opSqliteAdapter },
          { 'name': 'expo-sqlite', 'dbAdapter': expoSqliteAdapter },
          { 'name': 'powersync-sqlite', 'dbAdapter': psSqliteAdapter }
        ];
        let benchmarkSuite = new BenchmarkSuite(benchmarks);
        await benchmarkSuite.runBenchmarks();

      } catch (err) {
        console.error(err);
      }
    }

    runTests().then(() => console.log('DONE'));
  }, []);

  return (
    <View style={styles.container}>
      <Button
        title="Run tests"
        color="#000000"
        onPress={async () => {
          try {

            let opSqliteAdapter = new OPSqliteAdapter();
            let expoSqliteAdapter = new ExpoSqliteAdapter();
            let psSqliteAdapter = new PowersyncSqliteAdapter();
            let benchmarks = [
              { 'name': 'op-sqlite', 'dbAdapter': opSqliteAdapter },
              { 'name': 'expo-sqlite', 'dbAdapter': expoSqliteAdapter },
              { 'name': 'powersync-sqlite', 'dbAdapter': psSqliteAdapter }
            ];
            let benchmarkSuite = new BenchmarkSuite(benchmarks);
            await benchmarkSuite.runBenchmarks();
            // console.log(results.toString());

          } catch (err) {
            console.error(err);
          }

        }}
      />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});