import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, Animated, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getStaff, verifyPin } from '../../database';
import { useStaff, ROLE_PERMISSIONS } from '../../context/StaffContext';
import { useApp } from '../../context/AppContext';
import { PinPad } from '../../components/common/PinPad';

// ─── STAFF CARD ───────────────────────────────────────────────────────────────
const StaffCard = ({ staff, onSelect, isDark }) => {
  const perms = ROLE_PERMISSIONS[staff.role] || ROLE_PERMISSIONS.cashier;
  return (
    <TouchableOpacity
      onPress={() => onSelect(staff)}
      activeOpacity={0.8}
      style={{
        flex: 1, margin: 6, paddingVertical: 20, paddingHorizontal: 12,
        borderRadius: 20, borderWidth: 1.5,
        borderColor: isDark ? '#3F3F46' : '#E5E7EB',
        backgroundColor: isDark ? '#27272A' : '#FFFFFF',
        alignItems: 'center', gap: 10,
      }}
    >
      <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: `${perms.color}20`, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={perms.icon} size={28} color={perms.color} />
      </View>
      <View style={{ alignItems: 'center', gap: 4 }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: isDark ? '#FFFFFF' : '#111827', textAlign: 'center' }}>
          {staff.name}
        </Text>
        <View style={{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, backgroundColor: `${perms.color}20` }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: perms.color }}>{perms.label}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
export default function LoginScreen() {
  const [staffList, setStaffList] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [pinError, setPinError] = useState('');
  const [fadeAnim] = useState(new Animated.Value(0));
  const { login } = useStaff();
  const { isDark, settings } = useApp();

  const bg      = isDark ? '#000000' : '#F2F2F7';
  const surfBg  = isDark ? '#18181B' : '#FFFFFF';
  const borderC = isDark ? '#27272A' : '#F3F4F6';
  const textPri = isDark ? '#FFFFFF' : '#111827';
  const textMut = isDark ? '#71717A' : '#9CA3AF';

  useEffect(() => {
    loadStaff();
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const loadStaff = useCallback(() => {
    try { setStaffList(getStaff()); } catch (e) { console.warn(e); }
  }, []);

  const handlePinComplete = (pin) => {
    const verified = verifyPin(selectedStaff.id, pin);
    if (verified) {
      setPinError('');
      login(verified);
    } else {
      setPinError('Incorrect PIN. Try again.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top', 'bottom']}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>

        {/* Header */}
        <View style={{ alignItems: 'center', paddingTop: 36, paddingBottom: 28 }}>
          <View style={{ width: 72, height: 72, borderRadius: 18, overflow: 'hidden', marginBottom: 14 }}>
            <Image
              source={require('../../../assets/icon.png')}
              style={{ width: 96, height: 96, marginLeft: -12, marginTop: -12 }}
              resizeMode="cover"
            />
          </View>
          <Text style={{ fontSize: 24, fontWeight: '800', color: textPri }}>
            {settings.shop_name || 'FoodPOS'}
          </Text>
          <Text style={{ fontSize: 14, color: textMut, marginTop: 4 }}>
            {selectedStaff ? `Enter PIN for ${selectedStaff.name}` : 'Who is clocking in?'}
          </Text>
        </View>

        {/* ── STAFF SELECTION ── */}
        {!selectedStaff && (
          <View style={{ flex: 1, paddingHorizontal: 16 }}>
            <FlatList
              data={staffList}
              keyExtractor={(i) => String(i.id)}
              numColumns={2}
              contentContainerStyle={{ paddingBottom: 32 }}
              renderItem={({ item }) => (
                <StaffCard staff={item} onSelect={(s) => { setSelectedStaff(s); setPinError(''); }} isDark={isDark} />
              )}
              ListEmptyComponent={
                <View style={{ alignItems: 'center', paddingTop: 48 }}>
                  <Ionicons name="people-outline" size={48} color={isDark ? '#3F3F46' : '#E5E7EB'} />
                  <Text style={{ fontSize: 16, fontWeight: '600', color: textMut, marginTop: 12 }}>No staff accounts</Text>
                  <Text style={{ fontSize: 13, color: isDark ? '#52525B' : '#D1D5DB', marginTop: 4 }}>Add staff in Settings</Text>
                </View>
              }
            />
          </View>
        )}

        {/* ── PIN ENTRY ── */}
        {selectedStaff && (
          <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 32 }}>
            {/* Staff chip */}
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 12,
              paddingHorizontal: 18, paddingVertical: 12, borderRadius: 16,
              backgroundColor: surfBg, borderWidth: 1, borderColor: borderC,
              marginBottom: 36, width: '100%',
            }}>
              <View style={{
                width: 42, height: 42, borderRadius: 21,
                backgroundColor: `${ROLE_PERMISSIONS[selectedStaff.role]?.color || '#F97316'}20`,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Ionicons
                  name={ROLE_PERMISSIONS[selectedStaff.role]?.icon || 'person-circle'}
                  size={22}
                  color={ROLE_PERMISSIONS[selectedStaff.role]?.color || '#F97316'}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: textPri }}>{selectedStaff.name}</Text>
                <Text style={{ fontSize: 12, color: textMut, marginTop: 1 }}>
                  {ROLE_PERMISSIONS[selectedStaff.role]?.label || 'Staff'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => { setSelectedStaff(null); setPinError(''); }}
                style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: isDark ? '#27272A' : '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name="swap-horizontal-outline" size={18} color={textMut} />
              </TouchableOpacity>
            </View>

            <PinPad
              onComplete={handlePinComplete}
              onCancel={() => { setSelectedStaff(null); setPinError(''); }}
              isDark={isDark}
              error={pinError}
            />
          </View>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}