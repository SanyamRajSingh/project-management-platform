import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NetworkProvider } from './src/context/NetworkContext';
import { AuthProvider } from './src/context/AuthContext';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <NetworkProvider>
        <AuthProvider>
          <StatusBar style="dark" />
          <AppNavigator />
        </AuthProvider>
      </NetworkProvider>
    </SafeAreaProvider>
  );
}
