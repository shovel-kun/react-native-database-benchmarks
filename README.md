# React Native Database Benchmarks

A project to compare performance between various databases on React Native.

## Generate Android and iOS native bindings

- npx expo run:android
- npx expo run:ios

## Running the project

Please ensure you have generated the native bindings before running the app.

- expo start --android
- expo start --ios

## Benchmark limitations

1. Does not measure UI performance during database operations yet.
2. Only a single run of each test is recorded.
3. No UI yet - all results are logged to the console.
4. Does not test concurrent operations.

### OP SQLite

OP SQLite can be run using a performance mode flag. Using the following commands to set this up for the project. This must be done before the project is built.

The performance flag allows to tweak all possible performance enhancing compilation flags

- OP_SQLITE_PERF=1 npx pod-install

SQLite native thread safety at the cost of some performance.

- OP_SQLITE_PERF=2 npx pod-install

### Expo-sqlite

Expo sqlite does not support batching of queries out the box. The results for these were ignored in the final comparison.

## Running the original react-native-quick-sqlite tests

#### Steps to install the library:

- npm uninstall @journeyapps/react-native-quick-sqlite
- npx expo install react-native-quick-sqlite
- Comment out the code in the file referencing PowersyncSqliteAdapter which includes `adapters/powersync-sqlite-adapter.ts`. Also comment out lines 6, 20 and 25 in `App.tsx`.
- Uncomment out the code referencing react-native-quick-sqlite (line 6 onwards) in `adapters/rn-quick-sqlite-adapter.ts` and lines 12, 22 and 26 in `App.tsx`.
- You can to the inverse of the above steps to test the powersync fork of react-native-quick-sqlite
