import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Platform, Alert, PermissionsAndroid } from 'react-native';
import { getSetting, setSetting } from '../database';
import { printerState } from '../utils/printerState';

const PrinterContext = createContext(null);

let BLEPrinter = null;
if (Platform.OS === 'android') {
  try {
    BLEPrinter = require('react-native-thermal-receipt-printer-image-qr').BLEPrinter;
    console.log('PrinterContext: BLEPrinter loaded');
  } catch (e) {
    console.warn('PrinterContext: library error', e.message);
  }
}

export const PRINTER_STATUS = {
  DISCONNECTED: 'disconnected',
  INITIALIZING: 'initializing',
  SCANNING:     'scanning',
  CONNECTING:   'connecting',
  CONNECTED:    'connected',
  ERROR:        'error',
};

export const PrinterProvider = ({ children }) => {
  const [status, setStatus]         = useState(PRINTER_STATUS.DISCONNECTED);
  const [connectedDevice, setConnected] = useState(null);
  const [foundDevices, setFound]    = useState([]);
  const [isPrinting, setIsPrinting] = useState(false);
  const [errorMsg, setErrorMsg]     = useState('');

  // Subscribe to global printer state changes
  useEffect(() => {
    console.log('PrinterContext: subscribing to printerState');
    // Sync initial state
    const { isConnected, device } = printerState.getState();
    if (isConnected && device) {
      setConnected(device);
      setStatus(PRINTER_STATUS.CONNECTED);
    }
    const unsub = printerState.subscribe((isConnected, device) => {
      console.log('PrinterContext: printerState changed:', isConnected, device?.device_name);
      if (isConnected && device) {
        setConnected(device);
        setStatus(PRINTER_STATUS.CONNECTED);
      } else {
        setConnected(null);
        setStatus(PRINTER_STATUS.DISCONNECTED);
      }
    });
    return unsub;
  }, []);

  // Auto-connect to saved printer on app start
  useEffect(() => {
    if (Platform.OS !== 'android' || !BLEPrinter) return;
    const autoConnect = async () => {
      try {
        const address = getSetting('printer_address');
        const name    = getSetting('printer_name');
        if (!address) return; // No saved printer
        console.log('Auto-connecting to saved printer:', name, address);
        setConnected({ inner_mac_address: address, device_name: name });
        setStatus(PRINTER_STATUS.CONNECTING);
        await BLEPrinter.init();
        await BLEPrinter.connectPrinter(address);
        setStatus(PRINTER_STATUS.CONNECTED);
        console.log('Auto-connected to printer:', name);
      } catch (e) {
        // Silent fail — user can manually reconnect in Settings
        console.warn('Auto-connect failed:', e.message);
        setStatus(PRINTER_STATUS.DISCONNECTED);
      }
    };
    // Small delay to let app fully load first
    const timer = setTimeout(autoConnect, 2000);
    return () => clearTimeout(timer);
  }, []);

  // ── Request permissions ────────────────────────────────────────────────────
  const requestPermissions = useCallback(async () => {
    if (Platform.OS !== 'android') return true;
    try {
      if (Platform.Version >= 31) {
        const result = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        return Object.values(result).every(v => v === PermissionsAndroid.RESULTS.GRANTED);
      } else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
    } catch (e) { return false; }
  }, []);

  // ── Scan ──────────────────────────────────────────────────────────────────
  const scanDevices = useCallback(async () => {
    if (Platform.OS !== 'android' || !BLEPrinter) return;
    const ok = await requestPermissions();
    if (!ok) { setErrorMsg('Bluetooth permissions required.'); return; }
    setStatus(PRINTER_STATUS.INITIALIZING);
    setFound([]);
    setErrorMsg('');
    try {
      await BLEPrinter.init();
      setStatus(PRINTER_STATUS.SCANNING);
      const devices = await BLEPrinter.getDeviceList();
      console.log('Found devices:', JSON.stringify(devices));
      setFound(devices || []);
      setStatus(PRINTER_STATUS.DISCONNECTED);
    } catch (e) {
      console.warn('Scan error:', e.message);
      setStatus(PRINTER_STATUS.ERROR);
      setErrorMsg('Scan failed: ' + e.message);
    }
  }, [requestPermissions]);

  // ── Connect ───────────────────────────────────────────────────────────────
  const connectDevice = useCallback(async (device) => {
    if (Platform.OS !== 'android' || !BLEPrinter) return;
    setStatus(PRINTER_STATUS.CONNECTING);
    setErrorMsg('');
    try {
      await BLEPrinter.init();
      const address = device.inner_mac_address || device.address;
      await BLEPrinter.connectPrinter(address);
      setConnected(device);
      setStatus(PRINTER_STATUS.CONNECTED);
      setSetting('printer_address', address);
      setSetting('printer_name', device.device_name || device.name || 'Printer');
      console.log('Connected to:', device.device_name);
    } catch (e) {
      console.warn('Connect error:', e.message);
      setStatus(PRINTER_STATUS.ERROR);
      setErrorMsg('Could not connect: ' + e.message);
    }
  }, []);

  // ── Disconnect ────────────────────────────────────────────────────────────
  const disconnectDevice = useCallback(() => {
    if (Platform.OS !== 'android' || !BLEPrinter) return;
    try { BLEPrinter.closeConn(); } catch (_) {}
    setConnected(null);
    setStatus(PRINTER_STATUS.DISCONNECTED);
    setSetting('printer_address', '');
    setSetting('printer_name', '');
  }, []);

  // ── Print ─────────────────────────────────────────────────────────────────
  const printReceipt = useCallback(async (text) => {
    if (Platform.OS !== 'android') {
      Alert.alert('iOS Not Supported', 'Bluetooth printing is only available on Android.');
      return;
    }
    if (!BLEPrinter) return;

    setIsPrinting(true);
    try {
      // Always try to reconnect using saved address before printing
      // This handles the case where UI state lost track of connection
      const savedAddress = getSetting('printer_address');
      if (!savedAddress) {
        Alert.alert('No Printer', 'Please connect to a printer first in Settings → Bluetooth Printer.');
        setIsPrinting(false);
        return;
      }
      console.log('Auto-reconnecting to:', savedAddress);
      await BLEPrinter.init();
      await BLEPrinter.connectPrinter(savedAddress);
      console.log('Reconnected, printing...');
      BLEPrinter.printBill(text, {});
      console.log('Print sent');
      setStatus(PRINTER_STATUS.CONNECTED);
    } catch (e) {
      console.warn('Print error:', e.message);
      // If reconnect failed, try printing anyway (might still be connected)
      try {
        BLEPrinter.printBill(text, {});
        console.log('Print sent on retry');
      } catch (e2) {
        Alert.alert('Print Failed', 'Could not print. Go to Settings → Bluetooth Printer and reconnect.');
        setStatus(PRINTER_STATUS.DISCONNECTED);
      }
    }
    setTimeout(() => setIsPrinting(false), 1500);
  }, []);

  return (
    <PrinterContext.Provider value={{
      status, connectedDevice, foundDevices,
      isPrinting, errorMsg,
      scanDevices, connectDevice, disconnectDevice, printReceipt,
      isAndroid: Platform.OS === 'android',
      // Allow PrinterScreen to sync its local state back to context
      syncConnected: (device, s) => {
        setConnected(device);
        setStatus(s);
        if (device) {
          const address = device.inner_mac_address || device.address;
          setSetting('printer_address', address);
          setSetting('printer_name', device.device_name || 'Printer');
        } else {
          setSetting('printer_address', '');
          setSetting('printer_name', '');
        }
      },
    }}>
      {children}
    </PrinterContext.Provider>
  );
};

export const usePrinter = () => {
  const ctx = useContext(PrinterContext);
  if (!ctx) return {
    status: PRINTER_STATUS.DISCONNECTED,
    connectedDevice: null,
    foundDevices: [],
    isPrinting: false,
    errorMsg: '',
    scanDevices: async () => {},
    connectDevice: async () => {},
    disconnectDevice: () => {},
    printReceipt: () => {},
    syncConnected: () => {},
    isAndroid: false,
  };
  return ctx;
};