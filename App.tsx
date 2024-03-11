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
        // await runAllTests();
        // const results = await new OPSqlite().runAll();
        // console.log(results.toString());

      } catch (err) {
        console.error(err);
      }
    }

    // runTests().then(() => console.log('DONE main'));
  }, []);

  return (
    <View style={styles.container}>
      <Button
        title="Press me"
        color="#f194ff"
        onPress={async () => {
          try {
            // await runAllTests();
            // let opsqlite = new OPSqlite();
            // const results = await opsqlite.runAll();
            let expoSqlite = new ExpoSqlite();
            const results = await expoSqlite.runAll();
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
