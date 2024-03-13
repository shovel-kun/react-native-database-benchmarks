import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { BenchmarkSuite } from './database/benchmark-suite';
import { OPSqliteAdapter, ExpoSqliteAdapter, PowersyncSqliteAdapter } from './adapters/adapters';
import { BenchmarkBatched } from './interface/benchmark';
import { ClassNotImplementedError } from './errors/errors';
/**
 * RNQuickSqliteAdapter requires removing the @journeyapps/react-native-quick-sqlite libraries
 * Running the tests for that library requires a manual switch from journeyapps to react-native-quick-sqlite
 */
// import { RNQuickSqliteAdapter } from './adapters/rn-quick-sqlite-adapter';


export default function App() {
  useEffect(() => {
    const runTests = async () => {
      try {

        let opSqliteAdapter = new OPSqliteAdapter();
        let expoSqliteAdapter = new ExpoSqliteAdapter();
        let psSqliteAdapter = new PowersyncSqliteAdapter();
        // let rnQuickSqliteAdapter = new RNQuickSqliteAdapter();
        let benchmarks = [
          { 'name': 'op-sqlite', 'dbAdapter': opSqliteAdapter },
          { 'name': 'ps-sqlite', 'dbAdapter': psSqliteAdapter },
          // { 'name': 'rn-quick-sqlite', 'dbAdapter': rnQuickSqliteAdapter },
          { 'name': 'expo-sqlite', 'dbAdapter': expoSqliteAdapter },
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
      <Text>React native benchmarks</Text>
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