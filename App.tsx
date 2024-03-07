import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { setupDb, test1, test2, test3, test4, test5, test6, test8, test9, test10, test11, test12, test13, test14, test15, test16 } from './database/op-sqlite';
import Benchmark from './interface/benchmark';


export default function App() {
  useEffect(() => {
    const runTests = async () => {
      try {
        await setupDb();
        await Benchmark.record('Test 1', test1);
        await Benchmark.record('Test 2', test2);
        await Benchmark.record('Test 3', test3);
        await Benchmark.record('Test 4', test4);
        await Benchmark.record('Test 5', test5);
        await Benchmark.record('Test 6', test6);
        await Benchmark.record('Test 8', test8);
        await Benchmark.record('Test 9', test9);
        await Benchmark.record('Test 10', test10);
        await Benchmark.record('Test 11', test11);
        await Benchmark.record('Test 12', test12);
        await Benchmark.record('Test 13', test13);
        await Benchmark.record('Test 14', test14);
        await Benchmark.record('Test 15', test15);
        await Benchmark.record('Test 16', test16);
      } catch (err) {
        console.error(err);
      }
    }

    runTests().then(() => console.log('DONE'));
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
