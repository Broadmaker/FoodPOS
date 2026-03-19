import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';

/**
 * CategoryPills — minimal underline tab style.
 * Active tab shows an orange underline + bold text.
 * No background fill, no border box — clean and professional.
 * 
 * Android text clipping fix: minHeight + lineHeight + includeFontPadding: false
 */
export const CategoryPills = ({ categories, selected, onSelect, isDark, style }) => {
  const allCats = [{ id: null, name: 'All' }, ...categories];
  const textActive = '#F97316';
  const textInactive = isDark ? '#71717A' : '#9CA3AF';
  const underlineBg = isDark ? '#111111' : '#F8F8F8';
  const bottomBorder = isDark ? '#27272A' : '#E5E7EB';

  return (
    <View style={[{
      backgroundColor: underlineBg,
      borderBottomWidth: 1,
      borderBottomColor: bottomBorder,
    }, style]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={{ paddingHorizontal: 16, flexDirection: 'row' }}
      >
        {allCats.map((cat) => {
          const isActive = cat.id === null
            ? selected === null
            : selected === cat.id;

          return (
            <TouchableOpacity
              key={String(cat.id)}
              onPress={() => onSelect(cat.id)}
              activeOpacity={0.7}
              style={{
                marginRight: 24,
                paddingVertical: 12,
                minHeight: 44,
                justifyContent: 'center',
                alignItems: 'center',
                borderBottomWidth: 2.5,
                borderBottomColor: isActive ? '#F97316' : 'transparent',
              }}
            >
              <Text style={{
                fontSize: 13,
                fontWeight: isActive ? '700' : '500',
                color: isActive ? textActive : textInactive,
                includeFontPadding: false,
                lineHeight: 18,
              }}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};