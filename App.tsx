import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { OPSqlite } from './database/op-sqlite';
import Benchmark, { BenchmarkResults } from './interface/benchmark';
import { ExpoSqlite } from './database/expo-sqlite';


export default function App() {
  useEffect(() => {
    const runTests = async () => {
      try {
        let opsqlite = new OPSqlite();
        const opResults = await opsqlite.runAll();
        let expoSqlite = new ExpoSqlite();
        const expoResults = await expoSqlite.runAll();

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
            let opsqlite = new OPSqlite();
            const opResults = await opsqlite.runAll();
            let expoSqlite = new ExpoSqlite();
            const expoResults = await expoSqlite.runAll();
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

async function test(bm: OPSqlite): Promise<BenchmarkResults> {
  // console.log(bm.name);
  const results = await bm.runAll();
  return results;
}
