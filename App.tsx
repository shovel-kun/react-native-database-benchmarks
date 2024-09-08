import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { BenchmarkSuite } from './database/benchmark-suite';
import { OPSqliteAdapter, ExpoSqliteAdapter } from './adapters/adapters';
import { PowersyncSqliteAdapter } from './adapters/powersync-sqlite-adapter';
import * as Progress from 'react-native-progress';

function useConsoleLogs() {
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;

    console.log = (...args) => {
      setLogs((prevLogs) => [...prevLogs, args.map((arg) => JSON.stringify(arg)).join(' ')]);
      originalConsoleLog.apply(console, args);
    };

    console.error = (...args) => {
      setLogs((prevLogs) => [...prevLogs, 'ERROR: ' + args.map((arg) => JSON.stringify(arg)).join(' ')]);
      originalConsoleError.apply(console, args);
    };

    return () => {
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
    };
  }, []);

  return logs;
}

export default function App() {
  const [isLoading, setIsLoading] = useState(false);
  const logs = useConsoleLogs();

  useEffect(() => {
    const runTests = async () => {
      try {
        let opSqliteAdapter = new OPSqliteAdapter();
        let expoSqliteAdapter = new ExpoSqliteAdapter();
        let psSqliteAdapter = new PowersyncSqliteAdapter();

        let benchmarks = [
          { name: 'op-sqlite', dbAdapter: opSqliteAdapter },
          { name: 'ps-sqlite', dbAdapter: psSqliteAdapter },
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
      <ScrollView style={styles.logContainer}>
        {logs.map((log, index) => (
          <Text key={index} style={styles.logText}>
            {log}
          </Text>
        ))}
      </ScrollView>
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
    justifyContent: 'center',
    paddingTop: 50
  },
  logContainer: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 10
  },
  logText: {
    fontSize: 12,
    marginBottom: 5
  }
});
