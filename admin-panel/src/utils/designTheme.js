export const DEFAULT_CLASSIC_CONFIG = {
  colors: {
    primary: '#E11D48',
    secondary: '#FB7185',
    background: '#FAF8F5',
    surface: '#FFFFFF',
    textPrimary: '#1E293B',
    textMuted: '#64748B',
  },
  typography: {
    fontFamily: 'Inter',
  },
  shape: {
    borderRadius: 'soft',
    buttonStyle: 'filled',
  },
  layout: {
    showBanner: true,
    showLogo: true,
    itemViewMode: 'list',
    showDietaryBadges: true,
    showDescriptions: true,
  },
};

export const THEME_CATALOG = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Clean card-based layout, sticky category tabs, crisp typography.',
    locked: false,
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Bold editorial hero with full-bleed visuals and floating cards.',
    locked: true,
    badge: 'Coming Soon',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Ultra-clean typographic menu with hairline dividers.',
    locked: true,
    badge: 'Coming Soon',
  },
];

export const FONT_OPTIONS = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Plus Jakarta Sans', label: 'Plus Jakarta Sans' },
];

export const BORDER_RADIUS_OPTIONS = [
  { value: 'none', label: 'None', subtitle: '0px', px: '0px', smPx: '0px' },
  { value: 'soft', label: 'Soft', subtitle: '8px', px: '8px', smPx: '6px' },
  { value: 'rounded', label: 'Rounded', subtitle: '16px', px: '16px', smPx: '10px' },
];

export const BUTTON_STYLE_OPTIONS = [
  { value: 'filled', label: 'Filled' },
  { value: 'outline', label: 'Outline' },
  { value: 'pill', label: 'Pill' },
];

export const COLOR_FIELDS = [
  { key: 'primary', label: 'Primary Brand Color' },
  { key: 'secondary', label: 'Secondary / Accent Color' },
  { key: 'background', label: 'Background Color' },
  { key: 'surface', label: 'Card Surface Color' },
  { key: 'textPrimary', label: 'Text Primary Color' },
  { key: 'textMuted', label: 'Text Muted Color' },
];

export const COLOR_PRESETS = [
  { name: 'Rose Classic', primary: '#E11D48', secondary: '#FB7185' },
  { name: 'QRserv Green', primary: '#187932', secondary: '#FF6B35' },
  { name: 'Royal Indigo', primary: '#4F46E5', secondary: '#818CF8' },
  { name: 'Amber Bistro', primary: '#D97706', secondary: '#F59E0B' },
  { name: 'Espresso', primary: '#78350F', secondary: '#B45309' },
];

export const HEX_COLOR_REGEX = /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/;

export function isValidHexColor(value) {
  return typeof value === 'string' && HEX_COLOR_REGEX.test(value.trim());
}

export function normalizeHexInput(value, fallback) {
  if (!isValidHexColor(value)) return fallback;
  const trimmed = value.trim();
  if (trimmed.length === 4) {
    const [, r, g, b] = trimmed;
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  return trimmed.toUpperCase();
}

export function hexToRgba(hex, alpha = 1) {
  const safe = normalizeHexInput(hex, '#E11D48').slice(1);
  const r = parseInt(safe.slice(0, 2), 16);
  const g = parseInt(safe.slice(2, 4), 16);
  const b = parseInt(safe.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function mergeClassicConfig(partial) {
  return {
    colors: {
      ...DEFAULT_CLASSIC_CONFIG.colors,
      ...(partial?.colors || {}),
    },
    typography: {
      ...DEFAULT_CLASSIC_CONFIG.typography,
      ...(partial?.typography || {}),
    },
    shape: {
      ...DEFAULT_CLASSIC_CONFIG.shape,
      ...(partial?.shape || {}),
    },
    layout: {
      ...DEFAULT_CLASSIC_CONFIG.layout,
      ...(partial?.layout || {}),
    },
  };
}

export function buildClassicCssVars(config) {
  const merged = mergeClassicConfig(config);
  const radiusOpt =
    BORDER_RADIUS_OPTIONS.find((r) => r.value === merged.shape.borderRadius) ||
    BORDER_RADIUS_OPTIONS[1];
  const isPill = merged.shape.buttonStyle === 'pill';

  return {
    '--qr-primary': merged.colors.primary,
    '--qr-primary-soft': hexToRgba(merged.colors.primary, 0.12),
    '--qr-secondary': merged.colors.secondary,
    '--qr-secondary-soft': hexToRgba(merged.colors.secondary, 0.15),
    '--qr-bg': merged.colors.background,
    '--qr-surface': merged.colors.surface,
    '--qr-text': merged.colors.textPrimary,
    '--qr-text-muted': merged.colors.textMuted,
    '--qr-border': hexToRgba(merged.colors.textMuted, 0.18),
    '--qr-font': `"${merged.typography.fontFamily}", system-ui, -apple-system, sans-serif`,
    '--qr-radius': radiusOpt.px,
    '--qr-radius-sm': radiusOpt.smPx,
    '--qr-btn-radius': isPill ? '9999px' : radiusOpt.smPx,
  };
}
