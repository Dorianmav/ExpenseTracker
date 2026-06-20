import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ColorSchemeName } from 'react-native';
import { AppColorScheme, PaletteName, defaultPaletteName, palettes } from '@/constants/Colors';

export type ThemeMode = 'auto' | 'light' | 'dark';

type ThemeModeContextValue = {
  mode: ThemeMode;
  paletteName: PaletteName;
  colorScheme: NonNullable<ColorSchemeName>;
  colors: AppColorScheme;
  setMode: (mode: ThemeMode) => void;
  setPaletteName: (paletteName: PaletteName) => void;
  cycleMode: () => void;
};

const ThemeModeContext = createContext<ThemeModeContextValue | null>(null);

const getAutomaticScheme = (): NonNullable<ColorSchemeName> => {
  const hour = new Date().getHours();
  return hour >= 7 && hour < 20 ? 'light' : 'dark';
};

const getNextMode = (mode: ThemeMode): ThemeMode => {
  if (mode === 'auto') return 'light';
  if (mode === 'light') return 'dark';
  return 'auto';
};

export function ThemeModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('auto');
  const [paletteName, setPaletteName] = useState<PaletteName>(defaultPaletteName);
  const [automaticScheme, setAutomaticScheme] = useState<NonNullable<ColorSchemeName>>(getAutomaticScheme);

  useEffect(() => {
    const interval = setInterval(() => {
      setAutomaticScheme(getAutomaticScheme());
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const colorScheme = mode === 'auto' ? automaticScheme : mode;
  const colors = palettes[paletteName][colorScheme];

  const value = useMemo<ThemeModeContextValue>(
    () => ({
      mode,
      paletteName,
      colorScheme,
      colors,
      setMode,
      setPaletteName,
      cycleMode: () => setMode((currentMode) => getNextMode(currentMode)),
    }),
    [colorScheme, colors, mode, paletteName],
  );

  return <ThemeModeContext.Provider value={value}>{children}</ThemeModeContext.Provider>;
}

export function useThemeMode() {
  const context = useContext(ThemeModeContext);

  if (!context) {
    throw new Error('useThemeMode must be used inside ThemeModeProvider');
  }

  return context;
}
