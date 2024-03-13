# React Native Database Benchmarks

A project to compare performance between various databases on React Native.

## Generate Android and iOS native bindings

- npx expo run:android
- npx expo run:ios 

## Running the project

Please ensure you have generated the native bindings before running the app.

- expo start --android  
- expo start --ios  

## Running react-native-quick-sqlite tests

Steps to install the library:
- npm uninstall @journeyapps/powersync-sdk-react-native
- npm uninstall @journeyapps/react-native-quick-sqlite
- npx expo install react-native-quick-sqlite
- Uncomment out the code referencing react-native-quick-sqlite in 
-
