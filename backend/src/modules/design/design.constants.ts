import {
  DesignBorderRadius,
  DesignButtonStyle,
  DesignFontFamily,
  DesignItemViewMode,
  StoreTheme,
} from '../../schemas/store-design.schema';

export interface ClassicConfigShape {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    textPrimary: string;
    textMuted: string;
  };
  typography: {
    fontFamily: DesignFontFamily;
  };
  shape: {
    borderRadius: DesignBorderRadius;
    buttonStyle: DesignButtonStyle;
  };
  layout: {
    showBanner: boolean;
    showLogo: boolean;
    itemViewMode: DesignItemViewMode;
    showDietaryBadges: boolean;
    showDescriptions: boolean;
  };
}

export const DEFAULT_ACTIVE_THEME = StoreTheme.CLASSIC;

export const DEFAULT_CLASSIC_CONFIG: ClassicConfigShape = {
  colors: {
    primary: '#E11D48',
    secondary: '#FB7185',
    background: '#FAF8F5',
    surface: '#FFFFFF',
    textPrimary: '#1E293B',
    textMuted: '#64748B',
  },
  typography: {
    fontFamily: DesignFontFamily.INTER,
  },
  shape: {
    borderRadius: DesignBorderRadius.SOFT,
    buttonStyle: DesignButtonStyle.FILLED,
  },
  layout: {
    showBanner: true,
    showLogo: true,
    itemViewMode: DesignItemViewMode.LIST,
    showDietaryBadges: true,
    showDescriptions: true,
  },
};

export function createDefaultClassicConfig(): ClassicConfigShape {
  return {
    colors: { ...DEFAULT_CLASSIC_CONFIG.colors },
    typography: { ...DEFAULT_CLASSIC_CONFIG.typography },
    shape: { ...DEFAULT_CLASSIC_CONFIG.shape },
    layout: { ...DEFAULT_CLASSIC_CONFIG.layout },
  };
}

/**
 * Deep-merges partial/stored Classic theme configuration with canonical defaults
 * so missing properties always fall back cleanly.
 */
export function mergeClassicConfig(
  base?: Partial<ClassicConfigShape> | null,
  patch?: Partial<ClassicConfigShape> | null,
): ClassicConfigShape {
  const defaults = createDefaultClassicConfig();
  return {
    colors: {
      ...defaults.colors,
      ...(base?.colors || {}),
      ...(patch?.colors || {}),
    },
    typography: {
      ...defaults.typography,
      ...(base?.typography || {}),
      ...(patch?.typography || {}),
    },
    shape: {
      ...defaults.shape,
      ...(base?.shape || {}),
      ...(patch?.shape || {}),
    },
    layout: {
      ...defaults.layout,
      ...(base?.layout || {}),
      ...(patch?.layout || {}),
    },
  };
}
