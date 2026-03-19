/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx}',
    './src/**/*.{js,jsx}',
  ],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Brand — Orange
        primary: {
          DEFAULT: '#F97316',
          50:  '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316',
          600: '#EA580C',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
        },
        // Surfaces
        surface: {
          light: '#FFFFFF',
          dark:  '#1C1C1E',
        },
        background: {
          light: '#F2F2F7',
          dark:  '#000000',
        },
        card: {
          light: '#FFFFFF',
          dark:  '#2C2C2E',
        },
        border: {
          light: '#E5E5EA',
          dark:  '#3A3A3C',
        },
        // Text
        text: {
          primary:   { light: '#000000', dark: '#FFFFFF' },
          secondary: { light: '#6B6B6B', dark: '#EBEBF5' },
          muted:     { light: '#AEAEB2', dark: '#636366' },
        },
        // Status
        success: '#22C55E',
        danger:  '#EF4444',
        warning: '#F59E0B',
        info:    '#3B82F6',
      },
      fontFamily: {
        sans:       ['Poppins_400Regular'],
        medium:     ['Poppins_500Medium'],
        semibold:   ['Poppins_600SemiBold'],
        bold:       ['Poppins_700Bold'],
      },
    },
  },
  plugins: [],
};