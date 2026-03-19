import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePrinter, PRINTER_STATUS } from '../../context/PrinterContext';
import { useApp } from '../../context/AppContext';
import { buildReceiptLines } from '../../utils/receiptFormatter';

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    [PRINTER_STATUS.CONNECTED]:    { label: 'Connected',    bg: '#DCFCE7', text: '#16A34A', icon: 'checkmark-circle' },
    [PRINTER_STATUS.DISCONNECTED]: { label: 'Disconnected', bg: '#F3F4F6', text: '#6B7280', icon: 'radio-button-off' },
    [PRINTER_STATUS.CONNECTING]:   { label: 'Connecting…',  bg: '#FEF9C3', text: '#CA8A04', icon: 'sync' },
    [PRINTER_STATUS.SCANNING]:     { label: 'Scanning…',    bg: '#DBEAFE', text: '#2563EB', icon: 'search' },
    [PRINTER_STATUS.ERROR]:        { label: 'Error',        bg: '#FEE2E2', text: '#DC2626', icon: 'alert-circle' },
  };
  const s = map[status] || map[PRINTER_STATUS.DISCONNECTED];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, backgroundColor: s.bg }}>
      <Ionicons name={s.icon} size={13} color={s.text} />
      <Text style={{ fontSize: 12, fontWeight: '700', color: s.text }}>{s.label}</Text>
    </View>
  );
};

// ─── DEVICE ROW ───────────────────────────────────────────────────────────────
const DeviceRow = ({ device, isConnected, onConnect, onDisconnect, isDark }) => {
  const borderC = isDark ? '#27272A' : '#F3F4F6';
  const textPri = isDark ? '#FFFFFF' : '#111827';
  const textMut = isDark ? '#71717A' : '#9CA3AF';

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: borderC, backgroundColor: isDark ? '#18181B' : '#FFFFFF' }}>
      <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: isConnected ? '#DCFCE7' : isDark ? '#27272A' : '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
        <Ionicons name="print-outline" size={20} color={isConnected ? '#16A34A' : isDark ? '#52525B' : '#9CA3AF'} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: textPri }}>{device.name}</Text>
        <Text style={{ fontSize: 12, color: textMut, marginTop: 1 }}>{device.address}</Text>
      </View>
      {isConnected ? (
        <TouchableOpacity
          onPress={onDisconnect}
          style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, backgroundColor: isDark ? '#27272A' : '#F3F4F6' }}
        >
          <Text style={{ fontSize: 13, fontWeight: '600', color: isDark ? '#71717A' : '#6B7280' }}>Disconnect</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={() => onConnect(device)}
          style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, backgroundColor: '#F97316' }}
        >
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}>Connect</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
export default function PrinterScreen({ onClose }) {
  const { isDark, settings, formatCurrency } = useApp();
  const {
    status, connectedDevice, foundDevices, isPrinting, errorMsg,
    scanDevices, connectDevice, disconnectDevice, printReceipt, isAndroid,
  } = usePrinter();

  const bg      = isDark ? '#000000' : '#F2F2F7';
  const surfBg  = isDark ? '#18181B' : '#FFFFFF';
  const borderC = isDark ? '#27272A' : '#F3F4F6';
  const textPri = isDark ? '#FFFFFF' : '#111827';
  const textMut = isDark ? '#71717A' : '#9CA3AF';

  // iOS — show unsupported message
  if (!isAndroid) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top']}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: surfBg, borderBottomWidth: 1, borderBottomColor: borderC }}>
          <TouchableOpacity onPress={onClose} style={{ marginRight: 12 }}>
            <Ionicons name="arrow-back" size={24} color={textPri} />
          </TouchableOpacity>
          <Text style={{ fontSize: 18, fontWeight: '700', color: textPri }}>Printer</Text>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <View style={{ width: 72, height: 72, borderRadius: 24, backgroundColor: isDark ? '#27272A' : '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Ionicons name="logo-apple" size={36} color={isDark ? '#52525B' : '#9CA3AF'} />
          </View>
          <Text style={{ fontSize: 18, fontWeight: '700', color: textPri, marginBottom: 8 }}>iOS Not Supported</Text>
          <Text style={{ fontSize: 14, color: textMut, textAlign: 'center', lineHeight: 22 }}>
            Bluetooth Classic printing is only available on Android. Most thermal printers use Bluetooth Classic, which iOS restricts to MFi-certified accessories only.
          </Text>
          <View style={{ marginTop: 24, padding: 16, backgroundColor: isDark ? '#1E3A5F' : '#EFF6FF', borderRadius: 14 }}>
            <Text style={{ fontSize: 13, color: isDark ? '#93C5FD' : '#2563EB', lineHeight: 20 }}>
              💡 Use the Android version of FoodPOS for printing. The receipt layout is already prepared for when you switch devices.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const handleTestPrint = async () => {
    const testOrder = {
      orderNumber: 'TEST-001',
      subtotal: 150,
      discountAmount: 0,
      total: 150,
      paymentMethod: 'cash',
      amountTendered: 200,
      changeAmount: 50,
    };
    const testItems = [
      { name: 'Chicken Adobo', price: 85, quantity: 1 },
      { name: 'Iced Coffee', price: 65, quantity: 1 },
    ];
    const lines = buildReceiptLines({ order: testOrder, cartItems: testItems, settings, formatCurrency });
    await printReceipt(lines);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top']}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: surfBg, borderBottomWidth: 1, borderBottomColor: borderC }}>
        <TouchableOpacity onPress={onClose} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: isDark ? '#27272A' : '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="arrow-back" size={20} color={textPri} />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '700', color: textPri }}>Bluetooth Printer</Text>
        <View style={{ width: 36 }} />
      </View>

      <FlatList
        data={foundDevices}
        keyExtractor={(d) => d.address}
        ListHeaderComponent={
          <View>
            {/* Status card */}
            <View style={{ margin: 16, padding: 16, borderRadius: 16, backgroundColor: surfBg, borderWidth: 1, borderColor: borderC, gap: 14 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: textPri }}>Connection Status</Text>
                <StatusBadge status={status} />
              </View>

              {connectedDevice && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, backgroundColor: isDark ? '#27272A' : '#F9FAFB', borderRadius: 12 }}>
                  <Ionicons name="print" size={20} color="#F97316" />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: textPri }}>{connectedDevice.name}</Text>
                    <Text style={{ fontSize: 12, color: textMut }}>{connectedDevice.address}</Text>
                  </View>
                </View>
              )}

              {errorMsg ? (
                <View style={{ padding: 12, backgroundColor: '#FEE2E2', borderRadius: 12 }}>
                  <Text style={{ fontSize: 13, color: '#DC2626' }}>{errorMsg}</Text>
                </View>
              ) : null}

              {/* Actions */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  onPress={scanDevices}
                  disabled={status === PRINTER_STATUS.SCANNING || status === PRINTER_STATUS.CONNECTING}
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12, backgroundColor: isDark ? '#27272A' : '#F3F4F6', borderWidth: 1.5, borderColor: isDark ? '#3F3F46' : '#E5E7EB' }}
                >
                  {status === PRINTER_STATUS.SCANNING
                    ? <ActivityIndicator size="small" color="#F97316" />
                    : <Ionicons name="bluetooth-outline" size={18} color={isDark ? '#D4D4D8' : '#374151'} />
                  }
                  <Text style={{ fontSize: 13, fontWeight: '600', color: isDark ? '#D4D4D8' : '#374151' }}>
                    {status === PRINTER_STATUS.SCANNING ? 'Scanning…' : 'Scan Devices'}
                  </Text>
                </TouchableOpacity>

                {status === PRINTER_STATUS.CONNECTED && (
                  <TouchableOpacity
                    onPress={handleTestPrint}
                    disabled={isPrinting}
                    style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12, backgroundColor: '#F97316' }}
                  >
                    {isPrinting
                      ? <ActivityIndicator size="small" color="white" />
                      : <Ionicons name="print-outline" size={18} color="white" />
                    }
                    <Text style={{ fontSize: 13, fontWeight: '700', color: 'white' }}>
                      {isPrinting ? 'Printing…' : 'Test Print'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Device list header */}
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
            isConnected={connectedDevice?.address === item.address && status === PRINTER_STATUS.CONNECTED}
            onConnect={connectDevice}
            onDisconnect={disconnectDevice}
            isDark={isDark}
          />
        )}
        ListEmptyComponent={
          status !== PRINTER_STATUS.SCANNING ? (
            <View style={{ alignItems: 'center', paddingTop: 32, paddingHorizontal: 32 }}>
              <Ionicons name="bluetooth-outline" size={48} color={isDark ? '#3F3F46' : '#E5E7EB'} />
              <Text style={{ fontSize: 15, fontWeight: '600', color: textMut, marginTop: 12 }}>No devices found</Text>
              <Text style={{ fontSize: 13, color: isDark ? '#52525B' : '#D1D5DB', marginTop: 6, textAlign: 'center' }}>
                Make sure your printer is powered on and paired in your phone's Bluetooth settings first, then tap Scan Devices.
              </Text>
            </View>
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}