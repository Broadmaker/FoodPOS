import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  Alert, ScrollView, ActivityIndicator, Image,
  KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { validateLicenseKey } from '../../utils/licenseUtils';
import { setSetting } from '../../database';

export default function ActivationScreen({ onActivated }) {
  const [shopName, setShopName] = useState('');
  const [licenseKey, setLicenseKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showKey, setShowKey] = useState(false);

  const handleActivate = () => {
    setError('');
    if (!shopName.trim()) { setError('Please enter your shop name.'); return; }
    if (!licenseKey.trim()) { setError('Please enter your license key.'); return; }

    setIsLoading(true);
    setTimeout(() => {
      const valid = validateLicenseKey(shopName.trim(), licenseKey.trim());
      if (valid) {
        // Save activation to database
        setSetting('is_activated', '1');
        setSetting('license_key', licenseKey.trim().toUpperCase());
        setSetting('shop_name', shopName.trim());
        setIsLoading(false);
        onActivated(shopName.trim());
      } else {
        setIsLoading(false);
        setError('Invalid license key for this shop name. Please check and try again.');
      }
    }, 800);
  };

  const formatKey = (text) => {
    // Auto-format as BM-XXXXXX-XXXXXX-XX
    const clean = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const parts = [];
    if (clean.length > 0) parts.push(clean.slice(0, 2));
    if (clean.length > 2) parts.push(clean.slice(2, 8));
    if (clean.length > 8) parts.push(clean.slice(8, 14));
    if (clean.length > 14) parts.push(clean.slice(14, 16));
    return parts.join('-');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F2F2F7' }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center' }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={{ alignItems: 'center', marginBottom: 36 }}>
          <View style={{ width: 90, height: 90, borderRadius: 24, overflow: 'hidden', marginBottom: 16 }}>
            <Image
              source={require('../../../assets/icon.png')}
              style={{ width: 120, height: 120, marginLeft: -15, marginTop: -15 }}
              resizeMode="cover"
            />
          </View>
          <Text style={{ fontSize: 28, fontWeight: '800', color: '#111827' }}>FoodPOS</Text>
          <Text style={{ fontSize: 14, color: '#9CA3AF', marginTop: 4 }}>by BroadMarkee</Text>
        </View>

        {/* Card */}
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#F3F4F6', gap: 16 }}>
          <View style={{ alignItems: 'center', gap: 6 }}>
            <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: '#FFF7ED', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="key-outline" size={22} color="#F97316" />
            </View>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#111827' }}>Activate FoodPOS</Text>
            <Text style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', lineHeight: 18 }}>
              Enter your shop name and license key to get started
            </Text>
          </View>

          {/* Shop Name */}
          <View>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
              Shop Name
            </Text>
            <TextInput
              value={shopName}
              onChangeText={(t) => { setShopName(t); setError(''); }}
              placeholder="Enter your shop name"
              placeholderTextColor="#D1D5DB"
              style={{ borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB', color: '#111827' }}
              autoCapitalize="words"
            />
          </View>

          {/* License Key */}
          <View>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
              License Key
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 12, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB', paddingHorizontal: 14 }}>
              <TextInput
                value={licenseKey}
                onChangeText={(t) => { setLicenseKey(formatKey(t)); setError(''); }}
                placeholder="BM-XXXXXX-XXXXXX-XX"
                placeholderTextColor="#D1D5DB"
                style={{ flex: 1, paddingVertical: 12, fontSize: 15, color: '#111827', letterSpacing: 1 }}
                autoCapitalize="characters"
                autoCorrect={false}
                secureTextEntry={!showKey}
              />
              <TouchableOpacity onPress={() => setShowKey(s => !s)}>
                <Ionicons name={showKey ? 'eye-off-outline' : 'eye-outline'} size={18} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Error */}
          {error ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, backgroundColor: '#FEE2E2', borderRadius: 12 }}>
              <Ionicons name="alert-circle-outline" size={16} color="#DC2626" />
              <Text style={{ flex: 1, fontSize: 13, color: '#DC2626' }}>{error}</Text>
            </View>
          ) : null}

          {/* Activate Button */}
          <TouchableOpacity
            onPress={handleActivate}
            disabled={isLoading}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 15, borderRadius: 14, backgroundColor: '#F97316', opacity: isLoading ? 0.7 : 1, marginTop: 4 }}
          >
            {isLoading
              ? <ActivityIndicator color="white" />
              : <Ionicons name="checkmark-circle-outline" size={20} color="white" />
            }
            <Text style={{ fontSize: 16, fontWeight: '700', color: 'white' }}>
              {isLoading ? 'Activating…' : 'Activate App'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={{ alignItems: 'center', marginTop: 24, gap: 4 }}>
          <Text style={{ fontSize: 12, color: '#D1D5DB' }}>Need a license key?</Text>
          <Text style={{ fontSize: 12, color: '#9CA3AF', fontWeight: '600' }}>Contact BroadMarkee</Text>
        </View>

      </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}