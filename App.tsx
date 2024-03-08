import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { runAllTests } from './database/op-sqlite';
import { runAllTestsExpo } from './database/expo-sqlite';
import Benchmark from './interface/benchmark';


export default function App() {
  useEffect(() => {
    const runTests = async () => {
      try {
        // await runAllTests();
        await runAllTestsExpo();

      } catch (err) {
        console.error(err);
      }
    }

    runTests().then(() => console.log('DONE'));
  }, []);

  return (
    <View style={styles.container}>
      <Button
        title="Press me"
        color="#f194ff"
        onPress={() => runAllTestsExpo()}
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
