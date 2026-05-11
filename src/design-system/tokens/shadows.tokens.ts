export const shadows = {
  none: 'none',
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.4)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.5), 0 1px 2px 0 rgba(0, 0, 0, 0.4)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.4)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.6), 0 4px 6px -2px rgba(0, 0, 0, 0.5)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.7), 0 10px 10px -5px rgba(0, 0, 0, 0.6)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.3)',
  // Cyber-Glass 2026 glassmorphism shadows
  glass: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
  glassHover: '0 12px 48px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
  elevated: '0 12px 48px rgba(0, 0, 0, 0.6)',
  modal: '0 20px 60px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
  // Colored shadows for specific use cases
  primary: {
    xs: '0 1px 2px 0 rgba(63, 81, 181, 0.05)',
    sm: '0 1px 3px 0 rgba(63, 81, 181, 0.1), 0 1px 2px 0 rgba(63, 81, 181, 0.06)',
    md: '0 4px 6px -1px rgba(63, 81, 181, 0.1), 0 2px 4px -1px rgba(63, 81, 181, 0.06)',
    lg: '0 10px 15px -3px rgba(63, 81, 181, 0.1), 0 4px 6px -2px rgba(63, 81, 181, 0.05)',
    xl: '0 20px 25px -5px rgba(63, 81, 181, 0.1), 0 10px 10px -5px rgba(63, 81, 181, 0.04)',
  },
  success: {
    xs: '0 1px 2px 0 rgba(76, 175, 80, 0.05)',
    sm: '0 1px 3px 0 rgba(76, 175, 80, 0.1), 0 1px 2px 0 rgba(76, 175, 80, 0.06)',
    md: '0 4px 6px -1px rgba(76, 175, 80, 0.1), 0 2px 4px -1px rgba(76, 175, 80, 0.06)',
    lg: '0 10px 15px -3px rgba(76, 175, 80, 0.1), 0 4px 6px -2px rgba(76, 175, 80, 0.05)',
    xl: '0 20px 25px -5px rgba(76, 175, 80, 0.1), 0 10px 10px -5px rgba(76, 175, 80, 0.04)',
  },
  warning: {
    xs: '0 1px 2px 0 rgba(255, 152, 0, 0.05)',
    sm: '0 1px 3px 0 rgba(255, 152, 0, 0.1), 0 1px 2px 0 rgba(255, 152, 0, 0.06)',
    md: '0 4px 6px -1px rgba(255, 152, 0, 0.1), 0 2px 4px -1px rgba(255, 152, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(255, 152, 0, 0.1), 0 4px 6px -2px rgba(255, 152, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(255, 152, 0, 0.1), 0 10px 10px -5px rgba(255, 152, 0, 0.04)',
  },
  danger: {
    xs: '0 1px 2px 0 rgba(244, 67, 54, 0.05)',
    sm: '0 1px 3px 0 rgba(244, 67, 54, 0.1), 0 1px 2px 0 rgba(244, 67, 54, 0.06)',
    md: '0 4px 6px -1px rgba(244, 67, 54, 0.1), 0 2px 4px -1px rgba(244, 67, 54, 0.06)',
    lg: '0 10px 15px -3px rgba(244, 67, 54, 0.1), 0 4px 6px -2px rgba(244, 67, 54, 0.05)',
    xl: '0 20px 25px -5px rgba(244, 67, 54, 0.1), 0 10px 10px -5px rgba(244, 67, 54, 0.04)',
  },
  // Dark theme shadows
  dark: {
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.3)',
  },
  // Cyber-Glass 2026 neon glow effects
  glow: {
    primary: '0 0 20px rgba(0, 194, 255, 0.3)', // Electric blue glow
    success: '0 0 20px rgba(0, 227, 150, 0.3)', // Emerald mint glow
    warning: '0 0 20px rgba(255, 189, 0, 0.3)', // Golden glow
    danger: '0 0 20px rgba(255, 77, 106, 0.3)', // Soft crimson glow
    info: '0 0 20px rgba(0, 194, 255, 0.3)', // Electric blue glow
  },
  // Outline shadows for focus states
  outline: {
    primary: '0 0 0 3px rgba(63, 81, 181, 0.2)',
    success: '0 0 0 3px rgba(76, 175, 80, 0.2)',
    warning: '0 0 0 3px rgba(255, 152, 0, 0.2)',
    danger: '0 0 0 3px rgba(244, 67, 54, 0.2)',
    info: '0 0 0 3px rgba(3, 169, 244, 0.2)',
  },
  // Elevation levels for consistent depth
  elevation: {
    level0: 'none',
    level1: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
    level2: '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
    level3: '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
    level4: '0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04)',
    level5: '0 25px 50px rgba(0, 0, 0, 0.25)',
  },
};
