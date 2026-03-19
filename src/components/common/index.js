import React from 'react';
import { TouchableOpacity, Text, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';

// ─── BUTTON ───────────────────────────────────────────────────────────────────
export const Button = ({
  title, onPress, variant = 'primary', size = 'md',
  loading = false, disabled = false, iconName, style, textClassName,
}) => {
  const isDisabled = disabled || loading;

  const base = 'flex-row items-center justify-center rounded-xl';
  const sizes = {
    sm: 'px-4 py-2',
    md: 'px-5 py-3',
    lg: 'px-6 py-4',
  };
  const textSizes = { sm: 'text-sm', md: 'text-base', lg: 'text-base' };
  const iconSizes = { sm: 16, md: 18, lg: 20 };

  const variants = {
    primary:   { btn: 'bg-primary-500',          text: 'text-white' },
    secondary: { btn: 'bg-white border border-primary-500', text: 'text-primary-500' },
    danger:    { btn: 'bg-red-500',               text: 'text-white' },
    success:   { btn: 'bg-green-500',             text: 'text-white' },
    ghost:     { btn: 'bg-transparent',           text: 'text-gray-500' },
  };

  const v = variants[variant] || variants.primary;
  const disabledCls = isDisabled ? 'opacity-40' : '';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      className={`${base} ${sizes[size]} ${v.btn} ${disabledCls} gap-2`}
      style={style}
    >
      {loading ? (
        <ActivityIndicator size="small" color="white" />
      ) : (
        <>
          {iconName && (
            <Ionicons
              name={iconName}
              size={iconSizes[size]}
              color={variant === 'primary' || variant === 'danger' || variant === 'success' ? 'white' : '#F97316'}
            />
          )}
          <Text className={`font-bold ${textSizes[size]} ${v.text} ${textClassName || ''}`}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

// ─── CARD ─────────────────────────────────────────────────────────────────────
export const Card = ({ children, className = '' }) => {
  const { isDark } = useApp();
  return (
    <View className={`rounded-2xl p-4 ${isDark ? 'bg-zinc-800 border border-zinc-700' : 'bg-white border border-gray-100'} shadow-sm ${className}`}>
      {children}
    </View>
  );
};

// ─── DIVIDER ──────────────────────────────────────────────────────────────────
export const Divider = ({ className = '' }) => {
  const { isDark } = useApp();
  return <View className={`h-px my-2 ${isDark ? 'bg-zinc-700' : 'bg-gray-100'} ${className}`} />;
};

// ─── BADGE ────────────────────────────────────────────────────────────────────
export const Badge = ({ label, variant = 'primary' }) => {
  const variants = {
    primary:  'bg-orange-100 text-orange-600',
    success:  'bg-green-100 text-green-600',
    danger:   'bg-red-100 text-red-600',
    warning:  'bg-amber-100 text-amber-600',
    neutral:  'bg-gray-100 text-gray-600',
  };
  const cls = variants[variant] || variants.primary;
  return (
    <View className={`px-2 py-0.5 rounded-full self-start ${cls.split(' ')[0]}`}>
      <Text className={`text-xs font-semibold ${cls.split(' ')[1]}`}>{label}</Text>
    </View>
  );
};

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────
export const EmptyState = ({ iconName = 'receipt-outline', title, subtitle, action }) => {
  const { isDark } = useApp();
  return (
    <View className="flex-1 items-center justify-center px-10 py-16">
      <View className={`w-20 h-20 rounded-full items-center justify-center mb-4 ${isDark ? 'bg-zinc-800' : 'bg-gray-100'}`}>
        <Ionicons name={iconName} size={36} color={isDark ? '#636366' : '#AEAEB2'} />
      </View>
      <Text className={`font-bold text-lg text-center mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{title}</Text>
      {subtitle && (
        <Text className={`text-sm text-center mb-5 ${isDark ? 'text-zinc-400' : 'text-gray-400'}`}>{subtitle}</Text>
      )}
      {action}
    </View>
  );
};

// ─── STAT CARD ────────────────────────────────────────────────────────────────
export const StatCard = ({ label, value, iconName, iconBg = 'bg-orange-100', iconColor = '#F97316' }) => {
  const { isDark } = useApp();
  return (
    <Card className="flex-1">
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <Text className={`text-xs mb-1 ${isDark ? 'text-zinc-400' : 'text-gray-400'}`}>{label}</Text>
          <Text className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</Text>
        </View>
        <View className={`w-10 h-10 rounded-xl items-center justify-center ${iconBg}`}>
          <Ionicons name={iconName} size={20} color={iconColor} />
        </View>
      </View>
    </Card>
  );
};

// ─── SECTION HEADER ───────────────────────────────────────────────────────────
export const SectionHeader = ({ title, onAction, actionLabel }) => {
  const { isDark } = useApp();
  return (
    <View className="flex-row justify-between items-center mb-3">
      <Text className={`font-bold text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>{title}</Text>
      {onAction && (
        <TouchableOpacity onPress={onAction}>
          <Text className="text-sm font-semibold text-primary-500">{actionLabel || 'See all'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// ─── SCREEN HEADER ────────────────────────────────────────────────────────────
export const ScreenHeader = ({ title, subtitle, rightElement }) => {
  const { isDark } = useApp();
  return (
    <View className={`flex-row justify-between items-center px-4 py-3 border-b ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-100'}`}>
      <View>
        <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{title}</Text>
        {subtitle && <Text className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-gray-400'}`}>{subtitle}</Text>}
      </View>
      {rightElement}
    </View>
  );
};

// ─── ICON BUTTON ─────────────────────────────────────────────────────────────
export const IconButton = ({ iconName, onPress, size = 24, className = '' }) => {
  const { isDark } = useApp();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className={`w-10 h-10 rounded-xl items-center justify-center ${isDark ? 'bg-zinc-800' : 'bg-gray-100'} ${className}`}
    >
      <Ionicons name={iconName} size={size} color={isDark ? '#FFFFFF' : '#1C1C1E'} />
    </TouchableOpacity>
  );
};