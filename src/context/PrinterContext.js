import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Platform, Alert } from 'react-native';
import { getSetting, setSetting } from '../database';

const PrinterContext = createContext(null);

// Only load on Android — iOS doesn't support Bluetooth Classic
let BluetoothManager       = null;
let BluetoothEscposPrinter = null;

if (Platform.OS === 'android') {
  try {
    const lib = require('react-native-bluetooth-escpos-printer');
    BluetoothManager       = lib.BluetoothManager;
    BluetoothEscposPrinter = lib.BluetoothEscposPrinter;
  } catch (e) {
    console.warn('Bluetooth printer library not available:', e.message);
  }
}

export const PRINTER_STATUS = {
  DISCONNECTED: 'disconnected',
  SCANNING:     'scanning',
  CONNECTING:   'connecting',
  CONNECTED:    'connected',
  ERROR:        'error',
};

export const PrinterProvider = ({ children }) => {
  const [status, setStatus]             = useState(PRINTER_STATUS.DISCONNECTED);
  const [connectedDevice, setConnected] = useState(null);
  const [foundDevices, setFound]        = useState([]);
  const [isPrinting, setIsPrinting]     = useState(false);
  const [errorMsg, setErrorMsg]         = useState('');

  // Restore saved printer info on mount (for display only — reconnect on demand)
  useEffect(() => {
    try {
      const address = getSetting('printer_address');
      const name    = getSetting('printer_name');
      if (address && name) {
        setConnected({ address, name });
      }
    } catch (e) { console.warn(e); }
  }, []);

  // ── SCAN ──────────────────────────────────────────────────────────────────
  const scanDevices = useCallback(async () => {
    if (Platform.OS !== 'android' || !BluetoothManager) return;
    setStatus(PRINTER_STATUS.SCANNING);
    setFound([]);
    setErrorMsg('');
    try {
      // enableBluetooth returns array of already-paired devices
      const paired = await BluetoothManager.enableBluetooth();
      const devices = (paired || [])
        .filter(d => d && d.address)
        .map(d => ({ name: d.name || 'Unknown Device', address: d.address }));
      setFound(devices);
      setStatus(PRINTER_STATUS.DISCONNECTED);
    } catch (e) {
      setStatus(PRINTER_STATUS.ERROR);
      setErrorMsg('Could not scan. Make sure Bluetooth is enabled on your phone.');
    }
  }, []);

  // ── CONNECT ───────────────────────────────────────────────────────────────
  const connectDevice = useCallback(async (device) => {
    if (Platform.OS !== 'android' || !BluetoothManager) return;
    setStatus(PRINTER_STATUS.CONNECTING);
    setErrorMsg('');
    try {
      await BluetoothManager.connect(device.address);
      setConnected(device);
      setStatus(PRINTER_STATUS.CONNECTED);
      setSetting('printer_address', device.address);
      setSetting('printer_name', device.name);
    } catch (e) {
      setStatus(PRINTER_STATUS.ERROR);
      setErrorMsg(`Could not connect to ${device.name}. Make sure it is powered on and in range.`);
    }
  }, []);

  // ── DISCONNECT ────────────────────────────────────────────────────────────
  const disconnectDevice = useCallback(async () => {
    if (Platform.OS !== 'android' || !BluetoothManager) return;
    try {
      await BluetoothManager.disconnect();
    } catch (_) {}
    setConnected(null);
    setStatus(PRINTER_STATUS.DISCONNECTED);
    setSetting('printer_address', '');
    setSetting('printer_name', '');
  }, []);

  // ── PRINT ─────────────────────────────────────────────────────────────────
  const printReceipt = useCallback(async (lines) => {
    if (Platform.OS !== 'android') {
      Alert.alert(
        'iOS Not Supported',
        'Bluetooth Classic printing is only available on Android. Most thermal printers use Bluetooth Classic which iOS does not support for third-party apps.'
      );
      return false;
    }
    if (!BluetoothEscposPrinter) return false;
    if (status !== PRINTER_STATUS.CONNECTED) {
      Alert.alert('Not Connected', 'Please connect to a printer first in Settings → Bluetooth Printer.');
      return false;
    }
    setIsPrinting(true);
    try {
      for (const line of lines) {
        await line();
      }
      setIsPrinting(false);
      return true;
    } catch (e) {
      setIsPrinting(false);
      setStatus(PRINTER_STATUS.ERROR);
      setErrorMsg('Print failed. Check that the printer is still connected and has paper.');
      Alert.alert('Print Error', 'Could not print. Make sure the printer is on and connected.');
      return false;
    }
  }, [status]);

  return (
    <PrinterContext.Provider value={{
      status,
      connectedDevice,
      foundDevices,
      isPrinting,
      errorMsg,
      scanDevices,
      connectDevice,
      disconnectDevice,
      printReceipt,
      isAndroid: Platform.OS === 'android',
    }}>
      {children}
    </PrinterContext.Provider>
  );
};

export const usePrinter = () => {
  const ctx = useContext(PrinterContext);
  if (!ctx) throw new Error('usePrinter must be inside PrinterProvider');
  return ctx;
};