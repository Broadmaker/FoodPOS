import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getStaff, addStaff, updateStaff, deleteStaff } from '../../database';
import { useApp } from '../../context/AppContext';
import { useStaff, ROLE_PERMISSIONS } from '../../context/StaffContext';
import { PinPad } from '../../components/common/PinPad';
import { Button, Card, Divider } from '../../components/common';

const ROLES = [
  { id: 'admin',   label: 'Admin',   desc: 'Full access to all features', color: '#F97316', icon: 'shield-checkmark' },
  { id: 'cashier', label: 'Cashier', desc: 'POS and Orders only',         color: '#3B82F6', icon: 'person-circle'   },
];

// ─── STAFF FORM MODAL ─────────────────────────────────────────────────────────
const StaffFormModal = ({ visible, staff, onSave, onClose, isDark }) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('cashier');
  const [step, setStep] = useState('info');  // 'info' | 'pin' | 'confirm'
  const [newPin, setNewPin] = useState('');
  const [pinError, setPinError] = useState('');
  const isEdit = !!staff;

  useEffect(() => {
    if (staff) { setName(staff.name); setRole(staff.role); }
    else { setName(''); setRole('cashier'); }
    setStep('info'); setNewPin(''); setPinError('');
  }, [staff, visible]);

  const bg      = isDark ? '#18181B' : '#FFFFFF';
  const borderC = isDark ? '#27272A' : '#F3F4F6';
  const textPri = isDark ? '#FFFFFF' : '#111827';
  const textMut = isDark ? '#71717A' : '#9CA3AF';

  const handleInfoNext = () => {
    if (!name.trim()) return Alert.alert('Error', 'Name is required.');
    setStep('pin');
  };

  const handlePinFirst = (pin) => {
    setNewPin(pin);
    setStep('confirm');
    setPinError('');
  };

  const handlePinConfirm = (pin) => {
    if (pin !== newPin) {
      setPinError('PINs do not match. Try again.');
      setNewPin('');
      setStep('pin');
      return;
    }
    onSave({ name: name.trim(), role, pin });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: borderC }}>
          <TouchableOpacity onPress={onClose}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: '#EF4444' }}>Cancel</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 16, fontWeight: '700', color: textPri }}>
            {isEdit ? 'Edit Staff' : 'Add Staff'}
          </Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Step: Info */}
        {step === 'info' && (
          <View style={{ flex: 1, padding: 16, gap: 14 }}>
            <Card>
              <Text style={{ fontSize: 11, fontWeight: '700', color: textMut, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Maria Santos"
                placeholderTextColor={textMut}
                style={{ borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, borderColor: isDark ? '#3F3F46' : '#E5E7EB', backgroundColor: isDark ? '#27272A' : '#FFFFFF', color: textPri }}
              />
            </Card>

            <Card>
              <Text style={{ fontSize: 11, fontWeight: '700', color: textMut, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>Role</Text>
              {ROLES.map((r) => (
                <TouchableOpacity
                  key={r.id}
                  onPress={() => setRole(r.id)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: r.id === 'admin' ? 1 : 0, borderBottomColor: borderC }}
                >
                  <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: `${r.color}20`, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name={r.icon} size={20} color={r.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: textPri }}>{r.label}</Text>
                    <Text style={{ fontSize: 12, color: textMut, marginTop: 1 }}>{r.desc}</Text>
                  </View>
                  <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: role === r.id ? r.color : isDark ? '#3F3F46' : '#E5E7EB', backgroundColor: role === r.id ? r.color : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                    {role === r.id && <Ionicons name="checkmark" size={12} color="white" />}
                  </View>
                </TouchableOpacity>
              ))}
            </Card>

            <Button
              title={isEdit ? 'Next — Change PIN' : 'Next — Set PIN'}
              onPress={handleInfoNext}
              iconName="arrow-forward"
              size="lg"
            />
            {isEdit && (
              <Button
                title="Save without changing PIN"
                onPress={() => onSave({ name: name.trim(), role, pin: null })}
                variant="secondary"
                size="lg"
              />
            )}
          </View>
        )}

        {/* Step: Set PIN */}
        {step === 'pin' && (
          <View style={{ flex: 1, alignItems: 'center', padding: 32 }}>
            <Text style={{ fontSize: 22, fontWeight: '800', color: textPri, marginBottom: 6 }}>Set PIN</Text>
            <Text style={{ fontSize: 14, color: textMut, marginBottom: 32, textAlign: 'center' }}>
              Enter a 4-digit PIN for {name}
            </Text>
            <PinPad onComplete={handlePinFirst} onCancel={() => setStep('info')} isDark={isDark} error={pinError} />
          </View>
        )}

        {/* Step: Confirm PIN */}
        {step === 'confirm' && (
          <View style={{ flex: 1, alignItems: 'center', padding: 32 }}>
            <Text style={{ fontSize: 22, fontWeight: '800', color: textPri, marginBottom: 6 }}>Confirm PIN</Text>
            <Text style={{ fontSize: 14, color: textMut, marginBottom: 32, textAlign: 'center' }}>
              Enter the PIN again to confirm
            </Text>
            <PinPad onComplete={handlePinConfirm} onCancel={() => setStep('pin')} isDark={isDark} error={pinError} />
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

// ─── STAFF ROW ────────────────────────────────────────────────────────────────
const StaffRow = ({ staff, onEdit, onDelete, isCurrentUser, isDark }) => {
  const perms   = ROLE_PERMISSIONS[staff.role] || ROLE_PERMISSIONS.cashier;
  const borderC = isDark ? '#27272A' : '#F3F4F6';
  const textPri = isDark ? '#FFFFFF' : '#111827';
  const textMut = isDark ? '#71717A' : '#9CA3AF';

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: borderC, backgroundColor: isDark ? '#18181B' : '#FFFFFF' }}>
      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: `${perms.color}20`, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
        <Ionicons name={perms.icon} size={22} color={perms.color} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: textPri }}>{staff.name}</Text>
          {isCurrentUser && (
            <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: '#F0FDF4' }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: '#16A34A' }}>YOU</Text>
            </View>
          )}
        </View>
        <Text style={{ fontSize: 12, color: textMut, marginTop: 1 }}>{perms.label}</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TouchableOpacity
          onPress={() => onEdit(staff)}
          style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: isDark ? '#27272A' : '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="pencil-outline" size={16} color={textMut} />
        </TouchableOpacity>
        {!isCurrentUser && (
          <TouchableOpacity
            onPress={() => onDelete(staff)}
            style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: isDark ? '#2D1B1B' : '#FEE2E2', alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="trash-outline" size={16} color="#DC2626" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────
export default function StaffScreen({ onClose }) {
  const [staffList, setStaffList] = useState([]);
  const [editStaff, setEditStaff] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const { isDark } = useApp();
  const { currentStaff } = useStaff();

  const bg      = isDark ? '#000000' : '#F2F2F7';
  const surfBg  = isDark ? '#18181B' : '#FFFFFF';
  const borderC = isDark ? '#27272A' : '#F3F4F6';
  const textPri = isDark ? '#FFFFFF' : '#111827';
  const textMut = isDark ? '#71717A' : '#9CA3AF';

  useEffect(() => { load(); }, []);

  const load = useCallback(() => {
    try { setStaffList(getStaff()); } catch (e) { console.warn(e); }
  }, []);

  const handleSave = ({ name, role, pin }) => {
    if (editStaff) {
      updateStaff(editStaff.id, name, role, pin);
    } else {
      addStaff(name, role, pin);
    }
    setShowForm(false);
    setEditStaff(null);
    load();
  };

  const handleDelete = (staff) => {
    Alert.alert('Remove Staff', `Remove ${staff.name}? They will no longer be able to log in.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => { deleteStaff(staff.id); load(); } },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={['top']}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: surfBg, borderBottomWidth: 1, borderBottomColor: borderC }}>
        <TouchableOpacity onPress={onClose} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: isDark ? '#27272A' : '#F3F4F6', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="arrow-back" size={20} color={textPri} />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: '700', color: textPri }}>Staff Accounts</Text>
        <TouchableOpacity
          onPress={() => { setEditStaff(null); setShowForm(true); }}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12, backgroundColor: '#F97316' }}
        >
          <Ionicons name="add" size={16} color="white" />
          <Text style={{ fontSize: 13, fontWeight: '700', color: 'white' }}>Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={staffList}
        keyExtractor={(i) => String(i.id)}
        ListHeaderComponent={
          <View style={{ margin: 16, padding: 14, borderRadius: 14, backgroundColor: isDark ? '#1E3A5F' : '#EFF6FF', flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
            <Ionicons name="information-circle-outline" size={18} color="#3B82F6" />
            <Text style={{ flex: 1, fontSize: 13, color: isDark ? '#93C5FD' : '#2563EB', lineHeight: 18 }}>
              {'Admin has full access. Cashier can only use POS and view Orders.\nDefault PINs — Admin: 1234 · Staff: 0000'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <StaffRow
            staff={item}
            onEdit={(s) => { setEditStaff(s); setShowForm(true); }}
            onDelete={handleDelete}
            isCurrentUser={currentStaff?.id === item.id}
            isDark={isDark}
          />
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 48 }}>
            <Ionicons name="people-outline" size={48} color={isDark ? '#3F3F46' : '#E5E7EB'} />
            <Text style={{ fontSize: 15, fontWeight: '600', color: textMut, marginTop: 12 }}>No staff yet</Text>
          </View>
        }
      />

      <StaffFormModal
        visible={showForm}
        staff={editStaff}
        onSave={handleSave}
        onClose={() => { setShowForm(false); setEditStaff(null); }}
        isDark={isDark}
      />
    </SafeAreaView>
  );
}