import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import { getSettings, setSetting } from '../database';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState('system'); // 'light' | 'dark' | 'system'
  const [settings, setSettings] = useState({
    shop_name: 'My Food Shop',
    shop_address: '',
    shop_phone: '',
    tax_rate: '0',
    currency: 'P',
    receipt_footer: 'Thank you for dining with us!',
    cashier_name: 'Staff',
    gcash_number: '',
    gcash_name: '',
    gcash_qr_uri: '',
  });
  const [isLoading, setIsLoading] = useState(true);

  // Resolve actual scheme
  const isDark =
    themeMode === 'dark' ||
    (themeMode === 'system' && systemScheme === 'dark');

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = useCallback(() => {
    try {
      const s = getSettings();
      if (Object.keys(s).length > 0) {
        setSettings((prev) => ({ ...prev, ...s }));
        if (s.theme_mode) setThemeMode(s.theme_mode);
      }
    } catch (e) {
      console.warn('Settings load error:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateSetting = useCallback((key, value) => {
    setSetting(key, value);
    setSettings((prev) => ({ ...prev, [key]: String(value) }));
  }, []);

  const toggleTheme = useCallback(() => {
    const next = isDark ? 'light' : 'dark';
    setThemeMode(next);
    setSetting('theme_mode', next);
  }, [isDark]);

  const formatCurrency = useCallback(
    (amount) => `${settings.currency}${Number(amount || 0).toFixed(2)}`,
    [settings.currency]
  );

  return (
    <AppContext.Provider value={{
      settings, isLoading, isDark, themeMode,
      updateSetting, formatCurrency, loadSettings, toggleTheme,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
};