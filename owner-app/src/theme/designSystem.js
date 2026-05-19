/**
 * RestaurantOS Design System
 * ─────────────────────────────────────────────────────────────
 * Single source of truth for all colors, typography, spacing,
 * shadows and border radii used across the Owner App.
 */

export const Colors = {
  // Brand
  primary:      '#FF6B35',   // main orange
  primaryLight: '#FF8C5A',   // hover / active
  primaryDark:  '#E5521C',   // pressed
  primaryGlow:  'rgba(255,107,53,0.20)', // shadow tint

  // Backgrounds (dark-first)
  bg:         '#0A0A0F',   // deepest — screen bg
  surface:    '#12121A',   // cards, sheets
  surfaceAlt: '#1A1A26',   // elevated card bg
  border:     '#252535',   // subtle dividers
  borderFocus:'#FF6B35',   // focused input ring

  // Text
  textPrimary:   '#F0F0FA',   // headings
  textSecondary: '#8888AA',   // labels, captions
  textMuted:     '#44445A',   // placeholder, hint
  textInverse:   '#0A0A0F',  // on primary btn

  // Status
  success:  '#2DD4BF',
  warning:  '#FBBF24',
  error:    '#F87171',
  info:     '#60A5FA',

  // Status bg
  successBg: 'rgba(45,212,191,0.12)',
  warningBg: 'rgba(251,191,36,0.12)',
  errorBg:   'rgba(248,113,113,0.12)',
  infoBg:    'rgba(96,165,250,0.12)',

  // Misc
  white:       '#FFFFFF',
  black:       '#000000',
  transparent: 'transparent',
  overlay:     'rgba(0,0,0,0.65)',
};

export const Typography = {
  // Sizes
  xs:   11,
  sm:   13,
  md:   15,
  lg:   17,
  xl:   20,
  xxl:  24,
  xxxl: 30,
  hero: 38,

  // Weights (use as fontWeight strings)
  regular:     '400',
  medium:      '500',
  semibold:    '600',
  bold:        '700',
  extrabold:   '800',
};

export const Spacing = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 24,
  xxxl:32,
  huge: 48,
};

export const Radius = {
  xs:   6,
  sm:   10,
  md:   14,
  lg:   18,
  xl:   24,
  full: 999,
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 12,
  },
  glow: (color = '#FF6B35') => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
  }),
};
