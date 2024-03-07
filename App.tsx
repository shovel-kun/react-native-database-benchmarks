import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { setupDb, test1, test2, test3, test4, test5 } from './database/op-sqlite';
import Benchmark from './interface/benchmark';


export default function App() {
  useEffect(() => {
    const runTests = async () => {
      try {
        await setupDb();
        // await Benchmark.record('Test 1', test1);
        // await Benchmark.record('Test 2', test2);
        // await Benchmark.record('Test 3', test3);
        // await Benchmark.record('Test 4', test4);
        await Benchmark.record('Test 5', test5);
      } catch (err) {
        console.error(err);
      }
    }

    runTests();
  }, []);

  return (
    <View style={styles.container}>
      <Text>Does this change?</Text>
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
