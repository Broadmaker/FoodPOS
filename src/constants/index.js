// ─── COLORS ───────────────────────────────────────────────────────────────────
export const COLORS = {
  // Primary brand - warm amber/orange for food
  primary: '#F97316',
  primaryDark: '#EA580C',
  primaryLight: '#FED7AA',
  primaryMuted: '#FFF7ED',

  // Accents
  success: '#22C55E',
  successLight: '#DCFCE7',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  warning: '#EAB308',
  warningLight: '#FEF9C3',
  info: '#3B82F6',
  infoLight: '#DBEAFE',

  // Neutrals
  white: '#FFFFFF',
  black: '#0F172A',
  gray50: '#F8FAFC',
  gray100: '#F1F5F9',
  gray200: '#E2E8F0',
  gray300: '#CBD5E1',
  gray400: '#94A3B8',
  gray500: '#64748B',
  gray600: '#475569',
  gray700: '#334155',
  gray800: '#1E293B',
  gray900: '#0F172A',

  // Surface
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceSecondary: '#F1F5F9',
  border: '#E2E8F0',
  borderFocus: '#F97316',

  // Text
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',
};

// ─── TYPOGRAPHY ───────────────────────────────────────────────────────────────
export const FONTS = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semiBold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
};

export const FONT_SIZES = {
  xs: 10,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  '5xl': 40,
};

// ─── SPACING ──────────────────────────────────────────────────────────────────
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
};

// ─── BORDER RADIUS ────────────────────────────────────────────────────────────
export const RADIUS = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  '2xl': 24,
  full: 9999,
};

// ─── SHADOWS ──────────────────────────────────────────────────────────────────
export const SHADOWS = {
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
};

// ─── CATEGORIES ───────────────────────────────────────────────────────────────
export const DEFAULT_CATEGORIES = [
  { id: 1, name: 'All', icon: '🍽️' },
  { id: 2, name: 'Rice Meals', icon: '🍚' },
  { id: 3, name: 'Silog', icon: '🍳' },
  { id: 4, name: 'Snacks', icon: '🍟' },
  { id: 5, name: 'Coffee', icon: '☕' },
  { id: 6, name: 'Drinks', icon: '🥤' },
  { id: 7, name: 'Desserts', icon: '🍰' },
  { id: 8, name: 'Extras', icon: '➕' },
];

// ─── PAYMENT METHODS ──────────────────────────────────────────────────────────
export const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash', icon: '💵' },
  { id: 'gcash', label: 'GCash', icon: '📱' },
];

// ─── ORDER STATUS ─────────────────────────────────────────────────────────────
export const ORDER_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  VOIDED: 'voided',
};