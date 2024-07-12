import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BenchmarkSuite } from './database/benchmark-suite';
import { OPSqliteAdapter, ExpoSqliteAdapter } from './adapters/adapters';
import { PowersyncSqliteAdapter } from './adapters/powersync-sqlite-adapter';
import * as Progress from 'react-native-progress';
/**
 * RNQuickSqliteAdapter requires removing the @journeyapps/react-native-quick-sqlite libraries
 * Running the tests requires a manual switch from journeyapps to react-native-quick-sqlite
 * They cannot both be added into the same project as their build configs conflict.
 */
// import { RNQuickSqliteAdapter } from './adapters/rn-quick-sqlite-adapter';

export default function App() {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const runTests = async () => {
      try {
        let opSqliteAdapter = new OPSqliteAdapter();
        let expoSqliteAdapter = new ExpoSqliteAdapter();
        let psSqliteAdapter = new PowersyncSqliteAdapter();
        // let rnQuickSqliteAdapter = new RNQuickSqliteAdapter();
        let benchmarks = [
          { name: 'op-sqlite', dbAdapter: opSqliteAdapter },
          { name: 'ps-sqlite', dbAdapter: psSqliteAdapter },
          // { name: 'rn-quick-sqlite', dbAdapter: rnQuickSqliteAdapter }
          { name: 'expo-sqlite', dbAdapter: expoSqliteAdapter }
        ];
        let benchmarkSuite = new BenchmarkSuite(benchmarks);
        setIsLoading(true);
        await benchmarkSuite.runBenchmarks();
        setIsLoading(false);
      } catch (err) {
        console.error(err);
      }
    };

    runTests().then(() => console.log('DONE'));
  }, []);

  return (
    <View style={styles.container}>
      {!isLoading ? <Text>React native benchmarks</Text> : <Text>Running benchmarks...</Text>}
      {isLoading && <Progress.Circle size={30} indeterminate={true} />}
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
