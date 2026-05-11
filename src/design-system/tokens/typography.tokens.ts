export const typography = {
  fontFamily: {
    primary: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: '"JetBrains Mono", "Fira Code", "Consolas", "Monaco", "Courier New", monospace',
    display: '"Space Grotesk", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    heading: '"Space Grotesk", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    body: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    ticker: '"JetBrains Mono", "Fira Code", "Consolas", "Monaco", monospace',
  },
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
    '6xl': '3.75rem', // 60px
    '7xl': '4.5rem',  // 72px
    '8xl': '6rem',    // 96px
    '9xl': '8rem',    // 128px
    // Fine-grained sizes
    '10px': '0.625rem',
    '11px': '0.6875rem',
    '13px': '0.8125rem',
    '15px': '0.9375rem',
    '17px': '1.0625rem',
    '19px': '1.1875rem',
    '21px': '1.3125rem',
    '22px': '1.375rem',
    '23px': '1.4375rem',
    '25px': '1.5625rem',
    '26px': '1.625rem',
    '27px': '1.6875rem',
    '28px': '1.75rem',
    '29px': '1.8125rem',
    '31px': '1.9375rem',
    '32px': '2rem',
    '33px': '2.0625rem',
    '34px': '2.125rem',
    '35px': '2.1875rem',
    '36px': '2.25rem',
    '37px': '2.3125rem',
    '38px': '2.375rem',
    '39px': '2.4375rem',
    '40px': '2.5rem',
    '42px': '2.625rem',
    '44px': '2.75rem',
    '46px': '2.875rem',
    '48px': '3rem',
    '52px': '3.25rem',
    '56px': '3.5rem',
    '60px': '3.75rem',
    '64px': '4rem',
    '72px': '4.5rem',
    '80px': '5rem',
    '96px': '6rem',
  },
  fontWeight: {
    thin: 100,
    extralight: 200,
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  },
  lineHeight: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
    '3': 1.5,
    '4': 1.75,
    '5': 2,
    '6': 2.25,
    '7': 2.5,
    '8': 2.75,
    '9': 3,
    '10': 3.5,
  },
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
    '1px': '0.0625rem',
    '2px': '0.125rem',
    '3px': '0.1875rem',
    '4px': '0.25rem',
    '5px': '0.3125rem',
    '6px': '0.375rem',
    '7px': '0.4375rem',
    '8px': '0.5rem',
    '9px': '0.5625rem',
    '10px': '0.625rem',
  },
  // Cyber-Glass 2026 text styles
  textStyles: {
    h1: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontSize: '2.5rem', // 40px
      fontWeight: 600,
      lineHeight: 1.2,
      letterSpacing: '-0.025em',
    },
    h2: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontSize: '2rem', // 32px
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.025em',
    },
    h3: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontSize: '1.5rem', // 24px
      fontWeight: 600,
      lineHeight: 1.4,
      letterSpacing: '0em',
    },
    h4: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontSize: '1.25rem', // 20px
      fontWeight: 600,
      lineHeight: 1.4,
      letterSpacing: '0em',
    },
    h5: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontSize: '1.125rem', // 18px
      fontWeight: 600,
      lineHeight: 1.5,
      letterSpacing: '0em',
    },
    h6: {
      fontFamily: '"Space Grotesk", sans-serif',
      fontSize: '1rem', // 16px
      fontWeight: 600,
      lineHeight: 1.5,
      letterSpacing: '0em',
    },
    subtitle1: {
      fontFamily: '"Inter", sans-serif',
      fontSize: '1rem', // 16px
      fontWeight: 500,
      lineHeight: 1.5,
      letterSpacing: '0em',
    },
    subtitle2: {
      fontFamily: '"Inter", sans-serif',
      fontSize: '0.875rem', // 14px
      fontWeight: 500,
      lineHeight: 1.5,
      letterSpacing: '0.025em',
    },
    body1: {
      fontFamily: '"Inter", sans-serif',
      fontSize: '1rem', // 16px
      fontWeight: 400,
      lineHeight: 1.6,
      letterSpacing: '0em',
    },
    body2: {
      fontFamily: '"Inter", sans-serif',
      fontSize: '0.875rem', // 14px
      fontWeight: 400,
      lineHeight: 1.6,
      letterSpacing: '0.025em',
    },
    button: {
      fontFamily: '"Inter", sans-serif',
      fontSize: '0.875rem', // 14px
      fontWeight: 500,
      lineHeight: 1.4,
      letterSpacing: '0.025em',
      textTransform: 'none',
    },
    caption: {
      fontFamily: '"Inter", sans-serif',
      fontSize: '0.75rem', // 12px
      fontWeight: 400,
      lineHeight: 1.4,
      letterSpacing: '0.025em',
    },
    overline: {
      fontFamily: '"Inter", sans-serif',
      fontSize: '0.75rem', // 12px
      fontWeight: 500,
      lineHeight: 1.4,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
    },
    label: {
      fontFamily: '"Inter", sans-serif',
      fontSize: '0.875rem', // 14px
      fontWeight: 500,
      lineHeight: 1.4,
      letterSpacing: '0.025em',
    },
    input: {
      fontFamily: '"Inter", sans-serif',
      fontSize: '1rem', // 16px
      fontWeight: 400,
      lineHeight: 1.5,
      letterSpacing: '0em',
    },
    ticker: {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '0.875rem', // 14px
      fontWeight: 500,
      lineHeight: 1.5,
      letterSpacing: '0em',
    },
    code: {
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '0.875rem', // 14px
      fontWeight: 400,
      lineHeight: 1.5,
      letterSpacing: '0em',
    },
    small: {
      fontFamily: '"Inter", sans-serif',
      fontSize: '0.75rem', // 12px
      fontWeight: 400,
      lineHeight: 1.4,
      letterSpacing: '0.025em',
    },
    micro: {
      fontFamily: '"Inter", sans-serif',
      fontSize: '0.625rem', // 10px
      fontWeight: 400,
      lineHeight: 1.4,
      letterSpacing: '0.025em',
    },
  },
  // Responsive typography
  responsive: {
    h1: {
      mobile: { fontSize: '1.875rem', lineHeight: 1.2 },
      tablet: { fontSize: '2.25rem', lineHeight: 1.2 },
      desktop: { fontSize: '2.5rem', lineHeight: 1.1 },
    },
    h2: {
      mobile: { fontSize: '1.5rem', lineHeight: 1.3 },
      tablet: { fontSize: '1.875rem', lineHeight: 1.3 },
      desktop: { fontSize: '2rem', lineHeight: 1.2 },
    },
    h3: {
      mobile: { fontSize: '1.25rem', lineHeight: 1.4 },
      tablet: { fontSize: '1.5rem', lineHeight: 1.4 },
      desktop: { fontSize: '1.75rem', lineHeight: 1.3 },
    },
  },
};
