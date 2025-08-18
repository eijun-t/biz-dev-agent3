/**
 * モダンUIデザインシステム
 * shadcn/ui + Tailwind CSS ベース
 */

// カラーパレット - ダークモード対応
export const colors = {
  // プライマリカラー（グラデーション対応）
  primary: {
    50: 'hsl(238, 100%, 97%)',
    100: 'hsl(238, 100%, 94%)',
    200: 'hsl(238, 100%, 88%)',
    300: 'hsl(238, 99%, 81%)',
    400: 'hsl(238, 97%, 71%)',
    500: 'hsl(238, 84%, 67%)', // #667eea - メインカラー
    600: 'hsl(238, 75%, 58%)',
    700: 'hsl(238, 69%, 49%)',
    800: 'hsl(238, 69%, 41%)',
    900: 'hsl(238, 68%, 34%)',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },

  // セカンダリカラー
  secondary: {
    50: 'hsl(280, 100%, 97%)',
    100: 'hsl(280, 100%, 95%)',
    200: 'hsl(280, 100%, 90%)',
    300: 'hsl(280, 100%, 83%)',
    400: 'hsl(280, 97%, 73%)',
    500: 'hsl(280, 84%, 61%)', // #764ba2
    600: 'hsl(280, 75%, 52%)',
    700: 'hsl(280, 69%, 43%)',
    800: 'hsl(280, 69%, 36%)',
    900: 'hsl(280, 68%, 30%)',
  },

  // セマンティックカラー
  success: {
    light: '#68d391',
    DEFAULT: '#48bb78',
    dark: '#38a169',
  },
  warning: {
    light: '#fbb66b',
    DEFAULT: '#f6ad55',
    dark: '#ed8936',
  },
  danger: {
    light: '#fc9999',
    DEFAULT: '#fc8181',
    dark: '#f56565',
  },
  info: {
    light: '#63b3ed',
    DEFAULT: '#4299e1',
    dark: '#3182ce',
  },

  // ニュートラルカラー（ライト/ダーク両対応）
  neutral: {
    50: 'hsl(210, 40%, 98%)',
    100: 'hsl(210, 40%, 96%)',
    200: 'hsl(210, 40%, 90%)',
    300: 'hsl(210, 40%, 80%)',
    400: 'hsl(210, 40%, 60%)',
    500: 'hsl(210, 40%, 40%)',
    600: 'hsl(210, 40%, 30%)',
    700: 'hsl(210, 40%, 20%)',
    800: 'hsl(210, 40%, 10%)',
    900: 'hsl(210, 40%, 4%)',
  },

  // テーマカラー
  background: {
    light: '#ffffff',
    dark: '#0f0f23',
    card: {
      light: '#ffffff',
      dark: '#1a1a2e',
    },
  },
  
  text: {
    primary: {
      light: '#1a202c',
      dark: '#f7fafc',
    },
    secondary: {
      light: '#4a5568',
      dark: '#cbd5e0',
    },
    muted: {
      light: '#718096',
      dark: '#a0aec0',
    },
  },
};

// タイポグラフィシステム
export const typography = {
  fonts: {
    sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: '"JetBrains Mono", "Fira Code", "Cascadia Code", Consolas, monospace',
    display: '"Cal Sans", Inter, sans-serif',
  },
  
  sizes: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem',// 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
    '6xl': '3.75rem', // 60px
    '7xl': '4.5rem',  // 72px
  },

  weights: {
    thin: 100,
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  },

  lineHeights: {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
};

// スペーシングシステム
export const spacing = {
  0: '0',
  px: '1px',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  1.5: '0.375rem',  // 6px
  2: '0.5rem',      // 8px
  2.5: '0.625rem',  // 10px
  3: '0.75rem',     // 12px
  3.5: '0.875rem',  // 14px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  7: '1.75rem',     // 28px
  8: '2rem',        // 32px
  9: '2.25rem',     // 36px
  10: '2.5rem',     // 40px
  12: '3rem',       // 48px
  14: '3.5rem',     // 56px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
  28: '7rem',       // 112px
  32: '8rem',       // 128px
};

// ボーダー半径
export const borderRadius = {
  none: '0',
  sm: '0.125rem',   // 2px
  DEFAULT: '0.25rem', // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px',
};

// シャドウ
export const shadows = {
  xs: '0 0 0 1px rgba(0, 0, 0, 0.05)',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  none: 'none',
  
  // カラーシャドウ（ホバー効果用）
  primary: '0 10px 30px -10px rgba(102, 126, 234, 0.5)',
  secondary: '0 10px 30px -10px rgba(118, 75, 162, 0.5)',
};

// アニメーション
export const animations = {
  durations: {
    instant: '0ms',
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
    slower: '700ms',
  },
  
  easings: {
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    smooth: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
  },

  // Framer Motion バリアント
  variants: {
    fadeIn: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
    slideUp: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 },
    },
    slideInFromRight: {
      initial: { opacity: 0, x: 100 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -100 },
    },
    scale: {
      initial: { scale: 0.8, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      exit: { scale: 0.8, opacity: 0 },
    },
    rotate: {
      initial: { rotate: -180, opacity: 0 },
      animate: { rotate: 0, opacity: 1 },
      exit: { rotate: 180, opacity: 0 },
    },
  },
};

// ブレークポイント（レスポンシブ）
export const breakpoints = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// Z-index管理
export const zIndex = {
  hide: -1,
  base: 0,
  dropdown: 10,
  sticky: 20,
  overlay: 30,
  modal: 40,
  popover: 50,
  tooltip: 60,
  toast: 70,
  loading: 80,
  max: 9999,
};

// グリッドシステム
export const grid = {
  columns: 12,
  gap: spacing[4],
  container: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
};

// カスタムユーティリティ
export const utilities = {
  // グラスモーフィズム効果
  glassmorphism: {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  
  // ネオモーフィズム効果
  neumorphism: {
    light: {
      background: 'linear-gradient(145deg, #ffffff, #e6e6e6)',
      boxShadow: '20px 20px 60px #d1d1d1, -20px -20px 60px #ffffff',
    },
    dark: {
      background: 'linear-gradient(145deg, #1e1e1e, #191919)',
      boxShadow: '20px 20px 60px #141414, -20px -20px 60px #242424',
    },
  },

  // グラデーションテキスト
  gradientText: {
    primary: {
      background: colors.primary.gradient,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    },
  },

  // スクロールバーカスタマイズ
  scrollbar: {
    thin: {
      scrollbarWidth: 'thin',
      scrollbarColor: `${colors.primary[500]} transparent`,
    },
    hidden: {
      scrollbarWidth: 'none',
      '&::-webkit-scrollbar': {
        display: 'none',
      },
    },
  },
};

export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  animations,
  breakpoints,
  zIndex,
  grid,
  utilities,
};