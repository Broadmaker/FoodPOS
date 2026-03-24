import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Switch, Alert, Modal, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';
import { useStaff } from '../../context/StaffContext';
import StaffScreen from '../auth/StaffScreen';
import PrinterScreen from '../printer/PrinterScreen';
import ExportScreen from '../dashboard/ExportScreen';
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
  const [showExport, setShowExport] = useState(false);
  const [showLicense, setShowLicense] = useState(false);
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 }}>
            <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: isDark ? '#27272A' : '#FFF7ED', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="resize-outline" size={19} color="#F97316" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: isDark ? '#FFFFFF' : '#111827' }}>Paper Size</Text>
              <Text style={{ fontSize: 12, color: isDark ? '#71717A' : '#9CA3AF', marginTop: 1 }}>Select your thermal printer roll width</Text>
            </View>
            <View style={{ flexDirection: 'row', borderRadius: 10, overflow: 'hidden', borderWidth: 1.5, borderColor: isDark ? '#3F3F46' : '#E5E7EB' }}>
              {['58', '80'].map((size) => (
                <TouchableOpacity
                  key={size}
                  onPress={() => setForm(f => ({ ...f, paper_size: size }))}
                  style={{ paddingHorizontal: 14, paddingVertical: 7, backgroundColor: form.paper_size === size ? '#F97316' : 'transparent' }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '700', color: form.paper_size === size ? '#FFFFFF' : isDark ? '#9CA3AF' : '#6B7280' }}>{size}mm</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
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
          <TouchableOpacity
            onPress={() => setShowExport(true)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 }}
            activeOpacity={0.75}
          >
            <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: isDark ? '#27272A' : '#F0FDF4', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="download-outline" size={19} color="#16A34A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: isDark ? '#FFFFFF' : '#111827' }}>Export Sales Data</Text>
              <Text style={{ fontSize: 12, color: isDark ? '#71717A' : '#9CA3AF', marginTop: 1 }}>Export to Excel — summary, items, orders</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={isDark ? '#3F3F46' : '#E5E7EB'} />
          </TouchableOpacity>
          <View style={{ height: 1, backgroundColor: dividerC }} />
          <ComingSoonRow iconName="cloud-upload-outline" label="Cloud Backup" description="Auto-sync orders to the cloud" isDark={isDark} />
          <View style={{ height: 1, backgroundColor: dividerC }} />
          <ComingSoonRow iconName="sync-outline" label="Multi-Device Sync" description="Use on multiple devices at once" isDark={isDark} />
        </View>

        {/* ── PAYMENT ── */}
        <View style={{ backgroundColor: cardBg, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: cardBorder }}>
          <SectionTitle title="GCash Payment" isDark={isDark} />
          <View style={{ height: 1, backgroundColor: dividerC, marginVertical: 10 }} />
          <Field label="GCash Number" value={form.gcash_number} onChangeText={set('gcash_number')} placeholder="09XX-XXX-XXXX" keyboardType="phone-pad" isDark={isDark} />
          <Field label="Account Name" value={form.gcash_name} onChangeText={set('gcash_name')} placeholder="Full name on GCash" isDark={isDark} />
          <View style={{ marginTop: 8 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: isDark ? '#71717A' : '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>QR Code</Text>
            {form.gcash_qr_uri ? (
              <View style={{ alignItems: 'center', gap: 10 }}>
                <Image source={{ uri: form.gcash_qr_uri }} style={{ width: 160, height: 160, borderRadius: 12, borderWidth: 1, borderColor: isDark ? '#3F3F46' : '#E5E7EB' }} resizeMode="contain" />
                <TouchableOpacity
                  onPress={() => setForm(f => ({ ...f, gcash_qr_uri: '' }))}
                  style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10, backgroundColor: isDark ? '#2D1B1B' : '#FEE2E2' }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#DC2626' }}>Remove QR</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={async () => {
                  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
                  if (!perm.granted) { Alert.alert('Permission needed', 'Gallery permission is required.'); return; }
                  const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.9 });
                  if (!result.canceled && result.assets?.[0]) {
                    setForm(f => ({ ...f, gcash_qr_uri: result.assets[0].uri }));
                  }
                }}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 14, borderWidth: 1.5, borderColor: isDark ? '#3F3F46' : '#E5E7EB', borderStyle: 'dashed', backgroundColor: isDark ? '#27272A' : '#F9FAFB' }}
              >
                <Ionicons name="qr-code-outline" size={22} color={isDark ? '#52525B' : '#9CA3AF'} />
                <Text style={{ fontSize: 14, fontWeight: '600', color: isDark ? '#71717A' : '#9CA3AF' }}>Upload QR Screenshot</Text>
              </TouchableOpacity>
            )}
            <Text style={{ fontSize: 11, color: isDark ? '#52525B' : '#D1D5DB', marginTop: 8, textAlign: 'center' }}>
              Screenshot your GCash QR from the GCash app and upload it here
            </Text>
          </View>
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

        {/* ── STAFF & ACCESS ── */}
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
                <Text style={{ fontSize: 12, color: isDark ? '#71717A' : '#9CA3AF', marginTop: 1 }}>Add, edit or remove staff accounts & PINs</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={isDark ? '#3F3F46' : '#E5E7EB'} />
            </TouchableOpacity>
            <View style={{ height: 1, backgroundColor: dividerC }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 }}>
              <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: isDark ? '#27272A' : '#F0FDF4', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="shield-checkmark-outline" size={19} color="#16A34A" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: isDark ? '#FFFFFF' : '#111827' }}>Role Permissions</Text>
                <Text style={{ fontSize: 12, color: isDark ? '#71717A' : '#9CA3AF', marginTop: 1 }}>Admin: full access · Cashier: POS & Orders only</Text>
              </View>
            </View>
          </View>
        )}

        {/* ── ABOUT ── */}
        <View style={{ backgroundColor: cardBg, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: cardBorder }}>
          <SectionTitle title="About" isDark={isDark} />
          <View style={{ height: 1, backgroundColor: dividerC, marginVertical: 10 }} />
          <InfoRow label="App" value="FoodPOS" isDark={isDark} />
          <View style={{ height: 1, backgroundColor: dividerC }} />
          <InfoRow label="Version" value="1.0.0" isDark={isDark} />
          <View style={{ height: 1, backgroundColor: dividerC }} />
          <InfoRow label="Developer" value="Mark Kevin Sanig" isDark={isDark} />
          <View style={{ height: 1, backgroundColor: dividerC }} />
          <InfoRow label="Brand" value="BroadMarkee" isDark={isDark} />
          <View style={{ height: 1, backgroundColor: dividerC }} />
          <TouchableOpacity
            onPress={() => setShowLicense(true)}
            style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }}
            activeOpacity={0.75}
          >
            <Text style={{ flex: 1, fontSize: 14, color: isDark ? '#71717A' : '#9CA3AF' }}>License & Terms of Use</Text>
            <Ionicons name="chevron-forward" size={16} color={isDark ? '#3F3F46' : '#E5E7EB'} />
          </TouchableOpacity>
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

      {/* Staff Modal */}
      <Modal visible={showStaff} animationType="slide" presentationStyle="fullScreen">
        <StaffScreen onClose={() => setShowStaff(false)} />
      </Modal>

      {/* Printer Modal */}
      <Modal visible={showPrinter} animationType="slide" presentationStyle="fullScreen">
        <PrinterScreen onClose={() => setShowPrinter(false)} />
      </Modal>

      {/* Export Modal */}
      <Modal visible={showExport} animationType="slide" presentationStyle="fullScreen">
        <ExportScreen onClose={() => setShowExport(false)} />
      </Modal>

      {/* License Modal */}
      <Modal visible={showLicense} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? '#18181B' : '#FFFFFF' }} edges={['top']}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: isDark ? '#27272A' : '#F3F4F6' }}>
            <View style={{ width: 40 }} />
            <Text style={{ fontSize: 16, fontWeight: '700', color: isDark ? '#FFFFFF' : '#111827' }}>License & Terms</Text>
            <TouchableOpacity onPress={() => setShowLicense(false)}>
              <Ionicons name="close" size={22} color={isDark ? '#71717A' : '#9CA3AF'} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>

            {/* Brand */}
            <View style={{ alignItems: 'center', paddingVertical: 16 }}>
              <View style={{ width: 72, height: 72, borderRadius: 16, overflow: 'hidden', marginBottom: 10 }}>
                <Image
                  source={require('../../../assets/icon.png')}
                  style={{ width: 96, height: 96, marginLeft: -12, marginTop: -12 }}
                  resizeMode="cover"
                />
              </View>
              <Text style={{ fontSize: 22, fontWeight: '800', color: isDark ? '#FFFFFF' : '#111827' }}>FoodPOS</Text>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#F97316', marginTop: 2 }}>by BroadMarkee</Text>
              <Text style={{ fontSize: 11, color: isDark ? '#52525B' : '#9CA3AF', marginTop: 4, letterSpacing: 1.5, textTransform: 'uppercase' }}>Point of Sale System</Text>
            </View>

            {/* License */}
            <View style={{ backgroundColor: isDark ? '#27272A' : '#F9FAFB', borderRadius: 14, padding: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: isDark ? '#FFFFFF' : '#111827', marginBottom: 10 }}>Software License</Text>
              <Text style={{ fontSize: 13, color: isDark ? '#A1A1AA' : '#4B5563', lineHeight: 20, marginBottom: 10 }}>
                This software is licensed, not sold. By using FoodPOS, you agree to the following terms:
              </Text>
              {[
                'This license grants one (1) shop a single non-transferable right to use FoodPOS.',
                'You may not copy, distribute, resell, or sublicense this application to any third party.',
                'Reverse engineering, modification, or decompilation of this app is strictly prohibited.',
                'This is a one-time purchase license. Future major versions may require a separate license.',
              ].map((item, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                  <Text style={{ fontSize: 13, color: '#F97316', fontWeight: '700' }}>{i + 1}.</Text>
                  <Text style={{ flex: 1, fontSize: 13, color: isDark ? '#A1A1AA' : '#4B5563', lineHeight: 20 }}>{item}</Text>
                </View>
              ))}
            </View>

            {/* Terms */}
            <View style={{ backgroundColor: isDark ? '#27272A' : '#F9FAFB', borderRadius: 14, padding: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: isDark ? '#FFFFFF' : '#111827', marginBottom: 10 }}>Terms of Use</Text>
              {[
                'FoodPOS is provided "as is" without warranty of any kind, express or implied.',
                'The developer is not liable for any loss of data, revenue, or business disruption arising from the use of this application.',
                'All sales data is stored locally on your device. The developer has no access to your business data.',
                'Support and updates are provided at the discretion of the developer.',
                'Continued use of the app constitutes acceptance of these terms.',
              ].map((item, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                  <Text style={{ fontSize: 13, color: '#F97316', fontWeight: '700' }}>•</Text>
                  <Text style={{ flex: 1, fontSize: 13, color: isDark ? '#A1A1AA' : '#4B5563', lineHeight: 20 }}>{item}</Text>
                </View>
              ))}
            </View>

            {/* Privacy */}
            <View style={{ backgroundColor: isDark ? '#27272A' : '#F9FAFB', borderRadius: 14, padding: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: isDark ? '#FFFFFF' : '#111827', marginBottom: 10 }}>Data & Privacy</Text>
              <Text style={{ fontSize: 13, color: isDark ? '#A1A1AA' : '#4B5563', lineHeight: 20 }}>
                FoodPOS does not collect, transmit, or share any personal or business data. All information including orders, menu items, staff accounts, and settings are stored exclusively on this device using a local SQLite database.
              </Text>
            </View>

            {/* Copyright */}
            <View style={{ alignItems: 'center', paddingVertical: 12, gap: 4 }}>
              <Text style={{ fontSize: 12, color: isDark ? '#52525B' : '#9CA3AF' }}>© {new Date().getFullYear()} Mark Kevin Sanig — BroadMarkee</Text>
              <Text style={{ fontSize: 12, color: isDark ? '#52525B' : '#9CA3AF' }}>All rights reserved.</Text>
            </View>

          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}