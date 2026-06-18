import { argbFromHex, hexFromArgb, themeFromSourceColor } from '@material/material-color-utilities';

export const UNIBUS_M3_SOURCE_COLOR = '#315FDA';

export function createUniBusMaterialTheme(sourceColor = UNIBUS_M3_SOURCE_COLOR) {
  const theme = themeFromSourceColor(argbFromHex(sourceColor));
  const { light, dark } = theme.schemes;

  return {
    sourceColor,
    light: {
      primary: hexFromArgb(light.primary),
      onPrimary: hexFromArgb(light.onPrimary),
      primaryContainer: hexFromArgb(light.primaryContainer),
      onPrimaryContainer: hexFromArgb(light.onPrimaryContainer),
      secondary: hexFromArgb(light.secondary),
      secondaryContainer: hexFromArgb(light.secondaryContainer),
      tertiary: hexFromArgb(light.tertiary),
      tertiaryContainer: hexFromArgb(light.tertiaryContainer),
      surface: hexFromArgb(light.surface),
      onSurface: hexFromArgb(light.onSurface),
      outline: hexFromArgb(light.outline),
    },
    dark: {
      primary: hexFromArgb(dark.primary),
      onPrimary: hexFromArgb(dark.onPrimary),
      primaryContainer: hexFromArgb(dark.primaryContainer),
      onPrimaryContainer: hexFromArgb(dark.onPrimaryContainer),
      secondary: hexFromArgb(dark.secondary),
      secondaryContainer: hexFromArgb(dark.secondaryContainer),
      tertiary: hexFromArgb(dark.tertiary),
      tertiaryContainer: hexFromArgb(dark.tertiaryContainer),
      surface: hexFromArgb(dark.surface),
      onSurface: hexFromArgb(dark.onSurface),
      outline: hexFromArgb(dark.outline),
    },
  };
}
