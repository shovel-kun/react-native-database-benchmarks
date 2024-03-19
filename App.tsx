import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BenchmarkSuite } from './database/benchmark-suite';
import { OPSqliteAdapter, ExpoSqliteAdapter, ExpoNextSqliteAdapter } from './adapters/adapters';
import { PowersyncSqliteAdapter } from './adapters/powersync-sqlite-adapter';
/**
 * RNQuickSqliteAdapter requires removing the @journeyapps/react-native-quick-sqlite libraries
 * Running the tests requires a manual switch from journeyapps to react-native-quick-sqlite
 */
// import { RNQuickSqliteAdapter } from './adapters/rn-quick-sqlite-adapter';

export default function App() {
  useEffect(() => {
    const runTests = async () => {
      try {
        let opSqliteAdapter = new OPSqliteAdapter();
        let expoSqliteAdapter = new ExpoSqliteAdapter();
        let psSqliteAdapter = new PowersyncSqliteAdapter();
        let expoNextAdapter = new ExpoNextSqliteAdapter();
        // let rnQuickSqliteAdapter = new RNQuickSqliteAdapter();
        let benchmarks = [
          { name: 'op-sqlite', dbAdapter: opSqliteAdapter },
          { name: 'ps-sqlite', dbAdapter: psSqliteAdapter },
          // { name: 'rn-quick-sqlite', dbAdapter: rnQuickSqliteAdapter },
          { name: 'expo-sqlite', dbAdapter: expoSqliteAdapter },
          { name: 'expo-next-sqlite', dbAdapter: expoNextAdapter }
        ];
        let benchmarkSuite = new BenchmarkSuite(benchmarks);
        await benchmarkSuite.runBenchmarks();
      } catch (err) {
        console.error(err);
      }
    };

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
    justifyContent: 'center'
  }
});
