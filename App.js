import 'react-native-gesture-handler';
import './global.css';

import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, LogBox, Image } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';

import { initDatabase, getSetting } from './src/database';
import { CartProvider } from './src/context/CartContext';
import { AppProvider, useApp } from './src/context/AppContext';
import { StaffProvider, useStaff } from './src/context/StaffContext';
import { PrinterProvider } from './src/context/PrinterContext';
import AppNavigator from './src/navigation/AppNavigator';
import LoginScreen from './src/screens/auth/LoginScreen';
import ActivationScreen from './src/screens/auth/ActivationScreen';

LogBox.ignoreLogs(['InteractionManager has been deprecated']);

// ─── INNER ROOT ───────────────────────────────────────────────────────────────
function Root({ isActivated, onActivated }) {
  const { isDark } = useApp();
  const { currentStaff } = useStaff();

  // Show activation screen if not activated
  if (!isActivated) {
    return (
      <View style={{ flex: 1 }}>
        <StatusBar style="dark" />
        <ActivationScreen onActivated={onActivated} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }} className={isDark ? 'dark' : ''}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {currentStaff ? (
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      ) : (
        <LoginScreen />
      )}
    </View>
  );
}

// ─── SPLASH ───────────────────────────────────────────────────────────────────
function SplashScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 90, height: 90, borderRadius: 24, overflow: 'hidden', marginBottom: 16 }}>
        <Image
          source={require('./assets/icon.png')}
          style={{ width: 120, height: 120, marginLeft: -15, marginTop: -15 }}
          resizeMode="cover"
        />
      </View>
      <Text style={{ fontSize: 32, fontWeight: '800', color: '#F97316', letterSpacing: -1 }}>FoodPOS</Text>
      <Text style={{ fontSize: 14, color: '#9CA3AF', marginTop: 8 }}>Point of Sale System</Text>
      <ActivityIndicator color="#F97316" style={{ marginTop: 32 }} size="large" />
    </View>
  );
}

// ─── APP ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState(null);
  const [isActivated, setIsActivated] = useState(false);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    (async () => {
      try {
        await initDatabase();
        // Check activation status after DB is ready
        const activated = getSetting('is_activated');
        setIsActivated(activated === '1');
        setDbReady(true);
      } catch (e) {
        console.error('DB init error:', e);
        setDbError(e.message);
      }
    })();
  }, []);

  const handleActivated = (shopName) => {
    setIsActivated(true);
  };

  if (!fontsLoaded || !dbReady) {
    return (
      <SafeAreaProvider>
        <SplashScreen />
        {dbError && (
          <View style={{ position: 'absolute', bottom: 40, left: 20, right: 20 }}>
            <Text style={{ color: '#EF4444', textAlign: 'center', fontSize: 12 }}>DB Error: {dbError}</Text>
          </View>
        )}
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <AppProvider>
        <StaffProvider>
          <PrinterProvider>
            <CartProvider>
              <Root isActivated={isActivated} onActivated={handleActivated} />
            </CartProvider>
          </PrinterProvider>
        </StaffProvider>
      </AppProvider>
    </SafeAreaProvider>
  );
}