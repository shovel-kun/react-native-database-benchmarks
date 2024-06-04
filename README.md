# React Native Database Benchmarks

A project to compare performance between various databases on React Native.

## Install dependencies

You can install dependencies using yarn

- `yarn install`

## Generate Android and iOS native bindings

- npx expo run:android
- npx expo run:ios

## Running the project

Please ensure you have generated the native bindings before running the app.

## Android

1. Open the `android` directory in Android Studio.
2. It will take some time to sync and build gradle dependencies.
3. Select `Build` in the top menu > Select `Build Variant`.
4. Change the `:app` active build variant to `release`.
5. Run the app using the default configuration.
6. Click on the `Logcat` option in the bottom tool window (under the Run button).
7. You can use the `package:mine` filter in the filter bar to filter the results.
8. Once all the benchmarks are done running, it will print out the results in the log for all the tests in a CSV format.

## iOS

1. Open the `ios/reactnativedatabasebenchmarks.xcworkspace` in xcode.
2. Edit the scheme and choose the `Release` build configuration for the run.
3. Click the play button to run the app.

## Benchmark limitations

1. Does not measure UI performance during database operations yet.
2. Only a single run of each test is recorded.
3. No UI yet - all results are logged to the console.
4. Does not test concurrent operations.

### OP SQLite

OP SQLite can be run using a performance mode fla set in the `package.json` file. Using the following commands to set this up for the project. This must be done before the project is built.

`1` is thread unsafe, you should only use transactions but will be the fastest option for single operations. `2` is thread-safe and marginally slower.

```
"op-sqlite": {
    "performanceMode": "1"
}
```

### Expo-sqlite

Expo sqlite does not support batching of queries out the box. The results for these were ignored in the final comparison.

## Running the original react-native-quick-sqlite tests

#### Steps to install the library:

- npm uninstall @journeyapps/react-native-quick-sqlite
- npx expo install react-native-quick-sqlite
- Comment out the code in the file referencing PowersyncSqliteAdapter which includes `adapters/powersync-sqlite-adapter.ts`. Also comment out lines 6, 20 and 25 in `App.tsx`.
- Uncomment out the code referencing react-native-quick-sqlite (line 6 onwards) in `adapters/rn-quick-sqlite-adapter.ts` and lines 12, 22 and 26 in `App.tsx`.
- You can to the inverse of the above steps to test the powersync fork of react-native-quick-sqlite
