import { useThemeMode } from './ThemeModeProvider';

export function useColorScheme() {
  return useThemeMode().colorScheme;
}
