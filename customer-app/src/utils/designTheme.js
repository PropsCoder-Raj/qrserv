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

const BORDER_RADIUS_MAP = {
  none: { px: '0px', smPx: '0px' },
  soft: { px: '8px', smPx: '6px' },
  rounded: { px: '16px', smPx: '10px' },
};

const HEX_COLOR_REGEX = /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/;

function normalizeHex(hex, fallback) {
  if (typeof hex !== 'string' || !HEX_COLOR_REGEX.test(hex.trim())) {
    return fallback;
  }
  const trimmed = hex.trim();
  if (trimmed.length === 4) {
    const [, r, g, b] = trimmed;
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  return trimmed.toUpperCase();
}

function hexToRgba(hex, alpha = 1) {
  const safe = normalizeHex(hex, '#E11D48').slice(1);
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
  const radius =
    BORDER_RADIUS_MAP[merged.shape.borderRadius] || BORDER_RADIUS_MAP.soft;
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
    '--qr-radius': radius.px,
    '--qr-radius-sm': radius.smPx,
    '--qr-btn-radius': isPill ? '9999px' : radius.smPx,
    // Keep nested Tailwind v4 @theme utilities synced with the active restaurant theme
    '--color-primary': merged.colors.primary,
    '--color-primary-dark': merged.colors.primary,
    '--color-primary-50': hexToRgba(merged.colors.primary, 0.1),
    '--color-accent': merged.colors.secondary,
    '--color-surface': merged.colors.surface,
    '--color-surface-warm': merged.colors.background,
    '--color-text': merged.colors.textPrimary,
    '--color-text-light': merged.colors.textMuted,
  };
}
