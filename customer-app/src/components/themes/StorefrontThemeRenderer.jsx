import ClassicMenuTheme from './ClassicMenuTheme';

/**
 * Modular storefront theme dispatcher. Future themes (Modern, Minimal)
 * can be registered in this switch without modifying Menu.jsx.
 */
export default function StorefrontThemeRenderer({
  activeTheme = 'classic',
  classicConfig,
  ...props
}) {
  switch (activeTheme) {
    case 'classic':
    default:
      return <ClassicMenuTheme designConfig={classicConfig} {...props} />;
  }
}
