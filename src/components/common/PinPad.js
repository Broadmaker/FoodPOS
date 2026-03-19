import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Vibration } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PIN_LENGTH = 4;

const KEYS = ['1','2','3','4','5','6','7','8','9','','0','DEL'];

export const PinPad = ({ onComplete, onCancel, isDark, error, resetOnError = true }) => {
  const [pin, setPin] = useState('');
  const [shake, setShake] = useState(false);

  // Auto-reset on error
  useEffect(() => {
    if (error && resetOnError) {
      Vibration.vibrate(200);
      setShake(true);
      setTimeout(() => { setPin(''); setShake(false); }, 600);
    }
  }, [error]);

  const handleKey = (key) => {
    if (key === '') return;
    if (key === 'DEL') {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (pin.length >= PIN_LENGTH) return;
    const next = pin + key;
    setPin(next);
    if (next.length === PIN_LENGTH) {
      // Small delay so last dot fills visually before callback
      setTimeout(() => onComplete(next), 120);
    }
  };

  const bg      = isDark ? '#18181B' : '#FFFFFF';
  const keyBg   = isDark ? '#27272A' : '#F3F4F6';
  const keyText = isDark ? '#FFFFFF' : '#111827';
  const dotFill = '#F97316';
  const dotEmpty = isDark ? '#3F3F46' : '#E5E7EB';

  return (
    <View style={{ alignItems: 'center', width: '100%' }}>
      {/* PIN dots */}
      <View style={{
        flexDirection: 'row', gap: 16, marginBottom: 32,
        transform: shake ? [{ translateX: 10 }] : [],
      }}>
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <View
            key={i}
            style={{
              width: 16, height: 16, borderRadius: 8,
              backgroundColor: i < pin.length ? dotFill : dotEmpty,
              borderWidth: i < pin.length ? 0 : 1.5,
              borderColor: dotEmpty,
            }}
          />
        ))}
      </View>

      {/* Error message */}
      {error ? (
        <Text style={{ fontSize: 13, color: '#EF4444', fontWeight: '600', marginBottom: 16, marginTop: -16 }}>
          {error}
        </Text>
      ) : (
        <View style={{ height: 16, marginBottom: 16 }} />
      )}

      {/* Numpad */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', width: 240, gap: 12 }}>
        {KEYS.map((key, i) => {
          if (key === '') return <View key={i} style={{ width: 64, height: 64 }} />;
          return (
            <TouchableOpacity
              key={i}
              onPress={() => handleKey(key)}
              activeOpacity={0.7}
              style={{
                width: 64, height: 64, borderRadius: 32,
                backgroundColor: key === 'DEL' ? 'transparent' : keyBg,
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              {key === 'DEL' ? (
                <Ionicons name="backspace-outline" size={24} color={isDark ? '#71717A' : '#9CA3AF'} />
              ) : (
                <Text style={{ fontSize: 24, fontWeight: '600', color: keyText }}>{key}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Cancel */}
      {onCancel && (
        <TouchableOpacity onPress={onCancel} style={{ marginTop: 28, paddingVertical: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: isDark ? '#71717A' : '#9CA3AF' }}>Cancel</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};