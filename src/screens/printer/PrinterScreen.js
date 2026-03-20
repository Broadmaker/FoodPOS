import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { printerState } from '../../utils/printerState';
import { setSetting } from '../../database';
import { PRINTER_STATUS } from '../../context/PrinterContext';
import { buildReceiptText } from '../../utils/receiptFormatter';

// Load BLEPrinter directly — context doesn't reach through fullScreen Modal
let BLEPrinter = null;
if (Platform.OS === 'android') {
  try {
    BLEPrinter = require('react-native-thermal-receipt-printer-image-qr').BLEPrinter;
  } catch (e) {
    console.warn('BLEPrinter load error:', e.message);
  }
}

const StatusBadge = ({ status }) => {
  const map = {
    [PRINTER_STATUS.CONNECTED]:    { label: 'Connected',     bg: '#DCFCE7', text: '#16A34A', icon: 'checkmark-circle'  },
    [PRINTER_STATUS.DISCONNECTED]: { label: 'Disconnected',  bg: '#F3F4F6', text: '#6B7280', icon: 'radio-button-off'  },
    [PRINTER_STATUS.CONNECTING]:   { label: 'Connecting…',   bg: '#FEF9C3', text: '#CA8A04', icon: 'sync'              },
    [PRINTER_STATUS.INITIALIZING]: { label: 'Initializing…', bg: '#DBEAFE', text: '#2563EB', icon: 'sync'              },
    [PRINTER_STATUS.SCANNING]:     { label: 'Scanning…',     bg: '#DBEAFE', text: '#2563EB', icon: 'search'            },
    [PRINTER_STATUS.ERROR]:        { label: 'Error',         bg: '#FEE2E2', text: '#DC2626', icon: 'alert-circle'      },
  };
  const s = map[status] || map[PRINTER_STATUS.DISCONNECTED];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, backgroundColor: s.bg }}>
      <Ionicons name={s.icon} size={13} color={s.text} />
      <Text style={{ fontSize: 12, fontWeight: '700', color: s.text }}>{s.label}</Text>
    </View>
  );
};

const DeviceRow = ({ device, isConnected, onConnect, onDisconnect, isDark }) => {
  const borderC = isDark ? '#27272A' : '#F3F4F6';
  const textPri = isDark ? '#FFFFFF' : '#111827';
  const textMut = isDark ? '#71717A' : '#9CA3AF';
  const name    = device.device_name || device.name || 'Unknown Device';
  const address = device.inner_mac_address || device.address || '';
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: borderC, backgroundColor: isDark ? '#18181B' : '#FFFFFF' }}>
      <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: isConnected ? '#DCFCE7' : isDark ? '#27272A' : '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
        <Ionicons name="print-outline" size={20} color={isConnected ? '#16A34A' : isDark ? '#52525B' : '#9CA3AF'} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: textPri }}>{name}</Text>
        <Text style={{ fontSize: 12, color: textMut, marginTop: 1 }}>{address}</Text>
      </View>
      {isConnected ? (
        <TouchableOpacity onPress={() => onDisconnect(device)} style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, backgroundColor: isDark ? '#27272A' : '#F3F4F6' }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: isDark ? '#71717A' : '#6B7280' }}>Disconnect</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={() => onConnect(device)} style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, backgroundColor: '#F97316' }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}>Connect</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default function PrinterScreen({ onClose }) {
  const { isDark, settings, formatCurrency } = useApp();
  // Get global context for initial state + sync back
  // Initialize from global printerState (works even inside Modal)
  const { isConnected: initConnected, device: initDevice } = printerState.getState();

  const [status, setStatus]             = useState(initConnected ? PRINTER_STATUS.CONNECTED : PRINTER_STATUS.DISCONNECTED);
  const [connectedDevice, setConnected] = useState(initDevice);
  const [foundDevices, setFound]        = useState([]);
  const [isPrinting, setIsPrinting]     = useState(false);
  const [errorMsg, setErrorMsg]         = useState('');

  // ── Permissions ───────────────────────────────────────────────────────────
  const requestPermissions = async () => {
    if (Platform.Version >= 31) {
      const { PermissionsAndroid } = require('react-native');
      const result = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);
      return Object.values(result).every(v => v === PermissionsAndroid.RESULTS.GRANTED);
    }
    return true;
  };

  // ── Scan ──────────────────────────────────────────────────────────────────
  const scanDevices = async () => {
    console.log('=== SCAN ===');
    if (!BLEPrinter) { console.warn('BLEPrinter null'); return; }
    const ok = await requestPermissions();
    if (!ok) { setErrorMsg('Bluetooth permissions required.'); return; }
    setStatus(PRINTER_STATUS.INITIALIZING);
    setFound([]); setErrorMsg('');
    try {
      await BLEPrinter.init();
      setStatus(PRINTER_STATUS.SCANNING);
      const devices = await BLEPrinter.getDeviceList();
      console.log('Devices:', JSON.stringify(devices));
      setFound(devices || []);
      setStatus(PRINTER_STATUS.DISCONNECTED);
    } catch (e) {
      console.warn('Scan error:', e.message);
      setStatus(PRINTER_STATUS.ERROR);
      setErrorMsg('Scan failed: ' + e.message);
    }
  };

  // ── Connect ───────────────────────────────────────────────────────────────
  const connectDevice = async (device) => {
    console.log('=== CONNECT ===', device.device_name);
    if (!BLEPrinter) return;
    setStatus(PRINTER_STATUS.CONNECTING); setErrorMsg('');
    try {
      await BLEPrinter.init();
      const address = device.inner_mac_address || device.address;
      await BLEPrinter.connectPrinter(address);
      setConnected(device);
      setStatus(PRINTER_STATUS.CONNECTED);
      // Save to SQLite
      setSetting('printer_address', address);
      setSetting('printer_name', device.device_name || device.name || 'Printer');
      // Update global state so PrinterContext and tab bar update
      printerState.setConnected(device);
      console.log('Connected!');
    } catch (e) {
      console.warn('Connect error:', e.message);
      setStatus(PRINTER_STATUS.ERROR);
      setErrorMsg('Could not connect: ' + e.message);
    }
  };

  // ── Disconnect ────────────────────────────────────────────────────────────
  const disconnectDevice = () => {
    try { BLEPrinter && BLEPrinter.closeConn(); } catch (_) {}
    setConnected(null);
    setStatus(PRINTER_STATUS.DISCONNECTED);
    setSetting('printer_address', '');
    setSetting('printer_name', '');
    // Update global state
    printerState.setDisconnected();
  };

  // ── Print ─────────────────────────────────────────────────────────────────
  const printReceipt = (text) => {
    if (!BLEPrinter) return;
    if (status !== PRINTER_STATUS.CONNECTED) {
      Alert.alert('Not Connected', 'Connect to a printer first.');
      return;
    }
    setIsPrinting(true);
    try {
      BLEPrinter.printBill(text, {});
      console.log('Print sent');
    } catch (e) {
      Alert.alert('Print Error', e.message);
    }
    setTimeout(() => setIsPrinting(false), 1500);
  };

  const bg      = isDark ? '#000000' : '#F2F2F7';
  const surfBg  = isDark ? '#18181B' : '#FFFFFF';
  const borderC = isDark ? '#27272A' : '#F3F4F6';
  const textPri = isDark ? '#FFFFFF' : '#111827';
  const textMut = isDark ? '#71717A' : '#9CA3AF';

  if (Platform.OS !== 'android') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top']}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: surfBg, borderBottomWidth: 1, borderBottomColor: borderC }}>
          <TouchableOpacity onPress={onClose} style={{ marginRight: 12 }}>
            <Ionicons name="arrow-back" size={24} color={textPri} />
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: '700', color: textPri }}>Printer</Text>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Ionicons name="logo-apple" size={48} color={isDark ? '#52525B' : '#9CA3AF'} style={{ marginBottom: 16 }} />
          <Text style={{ fontSize: 18, fontWeight: '700', color: textPri, marginBottom: 8 }}>iOS Not Supported</Text>
          <Text style={{ fontSize: 14, color: textMut, textAlign: 'center', lineHeight: 22 }}>
            Bluetooth Classic printing is only available on Android.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleTestPrint = () => {
    const text = buildReceiptText({
      order: {
        orderNumber: 'TEST-001', subtotal: 150,
        discountAmount: 0, total: 150,
        paymentMethod: 'cash', amountTendered: 200, changeAmount: 50,
      },
      cartItems: [
        { name: 'Chicken Adobo', price: 85, quantity: 1 },
        { name: 'Iced Coffee',   price: 65, quantity: 1 },
      ],
      settings,
      formatCurrency,
    });
    printReceipt(text);
  };

  const isBusy = status === PRINTER_STATUS.SCANNING ||
                 status === PRINTER_STATUS.INITIALIZING ||
                 status === PRINTER_STATUS.CONNECTING;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: surfBg, borderBottomWidth: 1, borderBottomColor: borderC }}>
        <TouchableOpacity onPress={onClose} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: isDark ? '#27272A' : '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="arrow-back" size={20} color={textPri} />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '700', color: textPri }}>Bluetooth Printer</Text>
        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={foundDevices}
        keyExtractor={(d, i) => d.inner_mac_address || d.address || String(i)}
        ListHeaderComponent={
          <View>
            <View style={{ margin: 16, padding: 16, borderRadius: 16, backgroundColor: surfBg, borderWidth: 1, borderColor: borderC, gap: 14 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: textPri }}>Status</Text>
                <StatusBadge status={status} />
              </View>

              {connectedDevice && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, backgroundColor: isDark ? '#27272A' : '#F0FDF4', borderRadius: 12 }}>
                  <Ionicons name="print" size={20} color="#16A34A" />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: textPri }}>
                      {connectedDevice.device_name || connectedDevice.name || 'Printer'}
                    </Text>
                    <Text style={{ fontSize: 12, color: textMut }}>
                      {connectedDevice.inner_mac_address || connectedDevice.address}
                    </Text>
                  </View>
                </View>
              )}

              {errorMsg ? (
                <View style={{ padding: 12, backgroundColor: '#FEE2E2', borderRadius: 12 }}>
                  <Text style={{ fontSize: 13, color: '#DC2626' }}>{errorMsg}</Text>
                </View>
              ) : null}

              <View style={{ padding: 12, backgroundColor: isDark ? '#1E3A5F' : '#EFF6FF', borderRadius: 12 }}>
                <Text style={{ fontSize: 12, color: isDark ? '#93C5FD' : '#2563EB', lineHeight: 18 }}>
                  {'1. Turn on your printer\n2. Pair in Android Bluetooth Settings first\n3. Tap Scan → Connect → Test Print'}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  onPress={scanDevices}
                  disabled={isBusy}
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12, backgroundColor: isDark ? '#27272A' : '#F3F4F6', borderWidth: 1.5, borderColor: isDark ? '#3F3F46' : '#E5E7EB', opacity: isBusy ? 0.6 : 1 }}
                >
                  {isBusy ? <ActivityIndicator size="small" color="#F97316" />
                    : <Ionicons name="bluetooth-outline" size={18} color={isDark ? '#D4D4D8' : '#374151'} />}
                  <Text style={{ fontSize: 13, fontWeight: '600', color: isDark ? '#D4D4D8' : '#374151' }}>
                    {isBusy ? 'Please wait…' : 'Scan Devices'}
                  </Text>
                </TouchableOpacity>

                {status === PRINTER_STATUS.CONNECTED && (
                  <TouchableOpacity
                    onPress={handleTestPrint}
                    disabled={isPrinting}
                    style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12, backgroundColor: '#F97316', opacity: isPrinting ? 0.6 : 1 }}
                  >
                    {isPrinting ? <ActivityIndicator size="small" color="white" />
                      : <Ionicons name="print-outline" size={18} color="white" />}
                    <Text style={{ fontSize: 13, fontWeight: '700', color: 'white' }}>
                      {isPrinting ? 'Printing…' : 'Test Print'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {foundDevices.length > 0 && (
              <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: textMut, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  Paired Devices ({foundDevices.length})
                </Text>
              </View>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <DeviceRow
            device={item}
            isConnected={connectedDevice?.inner_mac_address === item.inner_mac_address && status === PRINTER_STATUS.CONNECTED}
            onConnect={connectDevice}
            onDisconnect={disconnectDevice}
            isDark={isDark}
          />
        )}
        ListEmptyComponent={
          !isBusy ? (
            <View style={{ alignItems: 'center', paddingTop: 32, paddingHorizontal: 32 }}>
              <Ionicons name="bluetooth-outline" size={48} color={isDark ? '#3F3F46' : '#E5E7EB'} />
              <Text style={{ fontSize: 15, fontWeight: '600', color: textMut, marginTop: 12 }}>No devices found</Text>
              <Text style={{ fontSize: 13, color: isDark ? '#52525B' : '#D1D5DB', marginTop: 6, textAlign: 'center' }}>
                Make sure your printer is paired in Android Bluetooth Settings, then tap Scan Devices.
              </Text>
            </View>
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}