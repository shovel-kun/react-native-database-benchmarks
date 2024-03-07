import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { setupDb, test1, test2 } from './database/op-sqlite';


export default function App() {
  useEffect(() => {
    setupDb().then(() => test1().then(() => test2()));
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
