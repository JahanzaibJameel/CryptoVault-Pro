 const primary = {
  50: '#e8eaf6',
  100: '#c5cae9',
  200: '#9fa8da',
  300: '#7986cb',
  400: '#5c6bc0',
  500: '#3f51b5',
  600: '#3949ab',
  700: '#303f9f',
  800: '#283593',
  900: '#1a237e',
};

const secondary = {
  50: '#fce4ec',
  100: '#f8bbd9',
  200: '#f48fb1',
  300: '#f06292',
  400: '#ec407a',
  500: '#e91e63',
  600: '#d81b60',
  700: '#c2185b',
  800: '#ad1457',
  900: '#880e4f',
};

export const colors = {
  // Cyber-Glass 2026 - Dark-first palette
  primary: {
    50: '#e6f7ff',
    100: '#b3e5ff',
    200: '#80d1ff',
    300: '#4dbdff',
    400: '#1aa9ff',
    500: '#00C2FF', // Electric blue accent
    600: '#00a8e6',
    700: '#008ecc',
    800: '#0074b3',
    900: '#005c99',
  },
  secondary: {
    50: '#fef0f5',
    100: '#fdd2e3',
    200: '#fbb4d1',
    300: '#f996bf',
    400: '#f778ad',
    500: '#f55a9b',
    600: '#d33c79',
    700: '#b11e57',
    800: '#8f0035',
    900: '#6d0013',
  },
  semantic: {
    focus: '#00C2FF',
  },
  success: {
    50: '#e6fff9',
    100: '#b3ffe8',
    200: '#80ffd7',
    300: '#4dffc6',
    400: '#1affb5',
    500: '#00E396', // Emerald mint
    600: '#00c985',
    700: '#00af74',
    800: '#009563',
    900: '#007b52',
  },
  warning: {
    50: '#fff9e6',
    100: '#ffedb3',
    200: '#ffe180',
    300: '#ffd54d',
    400: '#ffc91a',
    500: '#ffbd00',
    600: '#e6a600',
    700: '#cc8f00',
    800: '#b37800',
    900: '#996100',
  },
  danger: {
    50: '#ffe6ec',
    100: '#ffb3d1',
    200: '#ff80b6',
    300: '#ff4d9b',
    400: '#ff1a80',
    500: '#FF4D6A', // Soft crimson
    600: '#e63451',
    700: '#cc1b38',
    800: '#b3021f',
    900: '#990006',
  },
  info: {
    50: '#e6f7ff',
    100: '#b3e5ff',
    200: '#80d1ff',
    300: '#4dbdff',
    400: '#1aa9ff',
    500: '#00C2FF',
    600: '#00a8e6',
    700: '#008ecc',
    800: '#0074b3',
    900: '#005c99',
  },
  gray: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  text: {
    primary: '#FFFFFF', // White text
    secondary: '#8892B0', // Secondary blue-gray
    disabled: '#4a5568',
    hint: '#718096',
    inverse: '#0B0F19',
  },
  background: {
    default: '#0B0F19', // Deep slate background
    paper: '#131A2B', // Card background
    elevated: '#1a2332',
    overlay: 'rgba(11, 15, 25, 0.8)',
    glass: 'rgba(255, 255, 255, 0.04)', // Frosted glass surface
  },
  border: {
    default: 'rgba(255, 255, 255, 0.06)', // Subtle borders
    light: 'rgba(255, 255, 255, 0.04)',
    dark: 'rgba(255, 255, 255, 0.12)',
    focus: '#00C2FF',
    glass: 'rgba(255, 255, 255, 0.08)',
  },
  shadow: {
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.4)',
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.5), 0 1px 2px 0 rgba(0, 0, 0, 0.4)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.4)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.6), 0 4px 6px -2px rgba(0, 0, 0, 0.5)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.7), 0 10px 10px -5px rgba(0, 0, 0, 0.6)',
    glass: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
    elevated: '0 12px 48px rgba(0, 0, 0, 0.6)',
    glow: '0 0 20px rgba(0, 194, 255, 0.3)',
  },
};

// Dark theme is now the default - no separate darkColors needed
// All colors are optimized for dark-first design
