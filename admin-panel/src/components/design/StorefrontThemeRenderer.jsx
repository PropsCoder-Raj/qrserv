import ClassicMenuTheme from './ClassicMenuTheme';

/**
 * Modular theme dispatcher so additional themes (e.g. Modern, Minimal)
 * can be plugged in without refactoring the Design Studio shell.
 */
export default function StorefrontThemeRenderer({
  activeTheme = 'classic',
  classicConfig,
  restaurant,
  viewport = 'mobile',
}) {
  switch (activeTheme) {
    case 'classic':
    default:
      return (
        <ClassicMenuTheme
          config={classicConfig}
          restaurant={restaurant}
          viewport={viewport}
        />
      );
  }
}
