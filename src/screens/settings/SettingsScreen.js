import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Switch, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { useStaff } from '../../context/StaffContext';
import StaffScreen from '../auth/StaffScreen';
import PrinterScreen from '../printer/PrinterScreen';
import { Button, Card, Divider, ScreenHeader } from '../../components/common';

// ─── FIELD ───────────────────────────────────────────────────────────────────
const Field = ({ label, value, onChangeText, keyboardType = 'default', placeholder, multiline, isDark }) => (
  <View style={{ paddingVertical: 8 }}>
    <Text style={{ fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, color: isDark ? '#71717A' : '#9CA3AF' }}>{label}</Text>
    <TextInput
      value={value} onChangeText={onChangeText} placeholder={placeholder}
      placeholderTextColor={isDark ? '#52525B' : '#9CA3AF'}
      keyboardType={keyboardType} multiline={multiline} numberOfLines={multiline ? 3 : 1}
      style={{
        borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
        fontSize: 15, borderColor: isDark ? '#3F3F46' : '#E5E7EB',
        backgroundColor: isDark ? '#27272A' : '#FFFFFF', color: isDark ? '#FFFFFF' : '#111827',
        ...(multiline ? { minHeight: 72, textAlignVertical: 'top' } : {}),
      }}
    />
  </View>
);

// ─── INFO ROW ─────────────────────────────────────────────────────────────────
const InfoRow = ({ label, value, isDark }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 }}>
    <Text style={{ fontSize: 14, color: isDark ? '#71717A' : '#9CA3AF' }}>{label}</Text>
    <Text style={{ fontSize: 14, fontWeight: '600', color: isDark ? '#FFFFFF' : '#111827' }}>{value}</Text>
  </View>
);

// ─── COMING SOON ROW ──────────────────────────────────────────────────────────
const ComingSoonRow = ({ iconName, label, description, isDark }) => (
  <TouchableOpacity
    activeOpacity={0.6}
    onPress={() => Alert.alert('Coming Soon', `${label} will be available in a future update.`)}
    style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 }}>
    <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: isDark ? '#27272A' : '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={iconName} size={19} color={isDark ? '#52525B' : '#9CA3AF'} />
    </View>
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: isDark ? '#71717A' : '#9CA3AF' }}>{label}</Text>
        <View style={{ backgroundColor: isDark ? '#27272A' : '#F3F4F6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 }}>
          <Text style={{ fontSize: 10, fontWeight: '700', color: isDark ? '#52525B' : '#D1D5DB', letterSpacing: 0.5 }}>SOON</Text>
        </View>
      </View>
      <Text style={{ fontSize: 12, color: isDark ? '#52525B' : '#D1D5DB', marginTop: 1 }}>{description}</Text>
    </View>
    <Ionicons name="chevron-forward" size={16} color={isDark ? '#3F3F46' : '#E5E7EB'} />
  </TouchableOpacity>
);

// ─── SECTION TITLE ────────────────────────────────────────────────────────────
const SectionTitle = ({ title, isDark }) => (
  <Text style={{ fontSize: 13, fontWeight: '700', color: isDark ? '#FFFFFF' : '#111827', marginBottom: 4 }}>{title}</Text>
);

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
export default function SettingsScreen() {
  const { settings, updateSetting, isDark, toggleTheme } = useApp();
  const { currentStaff, permissions } = useStaff();
  const [showStaff, setShowStaff] = useState(false);
  const [showPrinter, setShowPrinter] = useState(false);
  const [form, setForm] = useState({ ...settings });
  const [saved, setSaved] = useState(false);

  useEffect(() => { setForm({ ...settings }); }, [settings]);

  const set = (key) => (v) => setForm((f) => ({ ...f, [key]: v }));

  const handleSave = () => {
    Object.entries(form).forEach(([k, v]) => updateSetting(k, v));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const bg = isDark ? '#000000' : '#F2F2F7';
  const cardBg = isDark ? '#18181B' : '#FFFFFF';
  const cardBorder = isDark ? '#27272A' : '#F3F4F6';
  const dividerC = isDark ? '#27272A' : '#F3F4F6';
  const textPrimary = isDark ? '#FFFFFF' : '#111827';
  const textMuted = isDark ? '#71717A' : '#9CA3AF';

  return (
    <View style={{ flex: 1 }}>
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top']}>
      <ScreenHeader title="Settings" />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>

        {/* ── APPEARANCE ── */}
        <View style={{ backgroundColor: cardBg, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: cardBorder }}>
          <SectionTitle title="Appearance" isDark={isDark} />
          <View style={{ height: 1, backgroundColor: dividerC, marginVertical: 10 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: isDark ? '#27272A' : '#FEF3C7', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={isDark ? 'moon' : 'sunny'} size={19} color={isDark ? '#F59E0B' : '#F97316'} />
              </View>
              <View>
                <Text style={{ fontSize: 14, fontWeight: '600', color: textPrimary }}>Dark Mode</Text>
                <Text style={{ fontSize: 12, color: textMuted, marginTop: 1 }}>{isDark ? 'Currently dark' : 'Currently light'}</Text>
              </View>
            </View>
            <Switch value={isDark} onValueChange={toggleTheme} trackColor={{ true: '#F97316', false: '#E5E5EA' }} />
          </View>
        </View>

        {/* ── SHOP INFO ── */}
        <View style={{ backgroundColor: cardBg, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: cardBorder }}>
          <SectionTitle title="Shop Information" isDark={isDark} />
          <View style={{ height: 1, backgroundColor: dividerC, marginVertical: 10 }} />
          <Field label="Shop Name" value={form.shop_name} onChangeText={set('shop_name')} placeholder="My Food Shop" isDark={isDark} />
          <View style={{ height: 1, backgroundColor: dividerC, marginVertical: 4 }} />
          <Field label="Address" value={form.shop_address} onChangeText={set('shop_address')} placeholder="123 Main Street" isDark={isDark} />
          <View style={{ height: 1, backgroundColor: dividerC, marginVertical: 4 }} />
          <Field label="Phone Number" value={form.shop_phone} onChangeText={set('shop_phone')} placeholder="09XX-XXX-XXXX" keyboardType="phone-pad" isDark={isDark} />
        </View>

        {/* ── POS CONFIG ── */}
        <View style={{ backgroundColor: cardBg, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: cardBorder }}>
          <SectionTitle title="POS Configuration" isDark={isDark} />
          <View style={{ height: 1, backgroundColor: dividerC, marginVertical: 10 }} />
          <Field label="Cashier Name" value={form.cashier_name} onChangeText={set('cashier_name')} placeholder="Staff" isDark={isDark} />
          <View style={{ height: 1, backgroundColor: dividerC, marginVertical: 4 }} />
          <Field label="Currency Symbol" value={form.currency} onChangeText={set('currency')} placeholder="₱" isDark={isDark} />
          <View style={{ height: 1, backgroundColor: dividerC, marginVertical: 4 }} />
          <Field label="Tax Rate (%)" value={form.tax_rate} onChangeText={set('tax_rate')} keyboardType="decimal-pad" placeholder="0" isDark={isDark} />
        </View>

        {/* ── RECEIPT ── */}
        <View style={{ backgroundColor: cardBg, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: cardBorder }}>
          <SectionTitle title="Receipt" isDark={isDark} />
          <View style={{ height: 1, backgroundColor: dividerC, marginVertical: 10 }} />
          <Field label="Footer Message" value={form.receipt_footer} onChangeText={set('receipt_footer')} placeholder="Thank you!" multiline isDark={isDark} />
        </View>

        {/* ── PRINTER ── */}
        <View style={{ backgroundColor: cardBg, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: cardBorder }}>
          <SectionTitle title="Printer" isDark={isDark} />
          <View style={{ height: 1, backgroundColor: dividerC, marginVertical: 10 }} />
          <TouchableOpacity
            onPress={() => setShowPrinter(true)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 }}
            activeOpacity={0.75}
          >
            <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: isDark ? '#27272A' : '#F0FDF4', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="bluetooth-outline" size={19} color="#16A34A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: isDark ? '#FFFFFF' : '#111827' }}>Bluetooth Printer</Text>
              <Text style={{ fontSize: 12, color: isDark ? '#71717A' : '#9CA3AF', marginTop: 1 }}>Connect ESC/POS thermal printer</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={isDark ? '#3F3F46' : '#E5E7EB'} />
          </TouchableOpacity>
          <View style={{ height: 1, backgroundColor: dividerC }} />
          <ComingSoonRow iconName="wifi-outline" label="Network Printer" description="Connect via LAN or Wi-Fi" isDark={isDark} />
          <View style={{ height: 1, backgroundColor: dividerC }} />
          <ComingSoonRow iconName="resize-outline" label="Paper Size" description="58mm or 80mm roll width" isDark={isDark} />
        </View>

        {/* ── STAFF & ACCESS ── */}
        <View style={{ backgroundColor: cardBg, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: cardBorder }}>
          <SectionTitle title="Staff & Access" isDark={isDark} />
          <View style={{ height: 1, backgroundColor: dividerC, marginVertical: 10 }} />
          <ComingSoonRow iconName="people-outline" label="Staff Accounts" description="Multiple cashier logins with roles" isDark={isDark} />
          <View style={{ height: 1, backgroundColor: dividerC }} />
          <ComingSoonRow iconName="lock-closed-outline" label="PIN Protection" description="Lock POS with a manager PIN" isDark={isDark} />
          <View style={{ height: 1, backgroundColor: dividerC }} />
          <ComingSoonRow iconName="shield-checkmark-outline" label="Permissions" description="Control access per staff role" isDark={isDark} />
        </View>

        {/* ── INVENTORY ── */}
        <View style={{ backgroundColor: cardBg, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: cardBorder }}>
          <SectionTitle title="Inventory" isDark={isDark} />
          <View style={{ height: 1, backgroundColor: dividerC, marginVertical: 10 }} />
          <ComingSoonRow iconName="cube-outline" label="Stock Tracking" description="Monitor item quantities in real time" isDark={isDark} />
          <View style={{ height: 1, backgroundColor: dividerC }} />
          <ComingSoonRow iconName="alert-circle-outline" label="Low Stock Alerts" description="Get notified when stock runs low" isDark={isDark} />
          <View style={{ height: 1, backgroundColor: dividerC }} />
          <ComingSoonRow iconName="bar-chart-outline" label="Inventory Reports" description="Export stock movement history" isDark={isDark} />
        </View>

        {/* ── DATA & SYNC ── */}
        <View style={{ backgroundColor: cardBg, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: cardBorder }}>
          <SectionTitle title="Data & Sync" isDark={isDark} />
          <View style={{ height: 1, backgroundColor: dividerC, marginVertical: 10 }} />
          <ComingSoonRow iconName="cloud-upload-outline" label="Cloud Backup" description="Auto-sync orders to the cloud" isDark={isDark} />
          <View style={{ height: 1, backgroundColor: dividerC }} />
          <ComingSoonRow iconName="sync-outline" label="Multi-Device Sync" description="Use on multiple devices at once" isDark={isDark} />
          <View style={{ height: 1, backgroundColor: dividerC }} />
          <ComingSoonRow iconName="download-outline" label="Export Data" description="Export sales to CSV or Excel" isDark={isDark} />
        </View>

        {/* ── INTEGRATIONS ── */}
        <View style={{ backgroundColor: cardBg, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: cardBorder }}>
          <SectionTitle title="Integrations" isDark={isDark} />
          <View style={{ height: 1, backgroundColor: dividerC, marginVertical: 10 }} />
          <ComingSoonRow iconName="phone-portrait-outline" label="GCash Auto-Confirm" description="Auto-verify GCash payments" isDark={isDark} />
          <View style={{ height: 1, backgroundColor: dividerC }} />
          <ComingSoonRow iconName="storefront-outline" label="Online Orders" description="Accept orders from delivery apps" isDark={isDark} />
          <View style={{ height: 1, backgroundColor: dividerC }} />
          <ComingSoonRow iconName="card-outline" label="Card Terminal" description="Connect a Tap-to-Pay card reader" isDark={isDark} />
        </View>

        {/* ── STAFF ── */}
        {permissions?.canAccessSettings && (
          <View style={{ backgroundColor: cardBg, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: cardBorder }}>
            <SectionTitle title="Staff & Access" isDark={isDark} />
            <View style={{ height: 1, backgroundColor: dividerC, marginVertical: 10 }} />
            <TouchableOpacity
              onPress={() => setShowStaff(true)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 }}
              activeOpacity={0.75}
            >
              <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: isDark ? '#27272A' : '#FFF7ED', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="people-outline" size={19} color="#F97316" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: isDark ? '#FFFFFF' : '#111827' }}>Manage Staff</Text>
                <Text style={{ fontSize: 12, color: isDark ? '#71717A' : '#9CA3AF', marginTop: 1 }}>Add, edit or remove staff accounts</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={isDark ? '#3F3F46' : '#E5E7EB'} />
            </TouchableOpacity>
          </View>
        )}

        {/* ── ABOUT ── */}
        <View style={{ backgroundColor: cardBg, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: cardBorder }}>
          <SectionTitle title="About" isDark={isDark} />
          <View style={{ height: 1, backgroundColor: dividerC, marginVertical: 10 }} />
          <InfoRow label="App Name" value="FoodPOS" isDark={isDark} />
          <View style={{ height: 1, backgroundColor: dividerC }} />
          <InfoRow label="Version" value="1.0.0 (Beta)" isDark={isDark} />
          <View style={{ height: 1, backgroundColor: dividerC }} />
          <InfoRow label="Database" value="Expo SQLite" isDark={isDark} />
          <View style={{ height: 1, backgroundColor: dividerC }} />
          <InfoRow label="UI" value="NativeWind v4" isDark={isDark} />
        </View>

      {/* ── STAFF MODAL — outside ScrollView so context works ── */}

        {/* Save Button */}
        <Button
          title={saved ? 'Saved!' : 'Save Settings'}
          onPress={handleSave}
          variant={saved ? 'success' : 'primary'}
          size="lg"
          iconName={saved ? 'checkmark-circle-outline' : 'save-outline'}
        />

      </ScrollView>
    </SafeAreaView>

      {/* Staff Modal — outside ScrollView so context providers are accessible */}
      <Modal visible={showStaff} animationType="slide" presentationStyle="fullScreen">
        <StaffScreen onClose={() => setShowStaff(false)} />
      </Modal>
    </View>
  );
}