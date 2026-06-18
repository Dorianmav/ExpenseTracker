import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ColorSchemeName } from 'react-native';

export type ThemeMode = 'auto' | 'light' | 'dark';

type ThemeModeContextValue = {
  mode: ThemeMode;
  colorScheme: NonNullable<ColorSchemeName>;
  setMode: (mode: ThemeMode) => void;
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
  const [automaticScheme, setAutomaticScheme] = useState<NonNullable<ColorSchemeName>>(getAutomaticScheme);

  useEffect(() => {
    const interval = setInterval(() => {
      setAutomaticScheme(getAutomaticScheme());
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const value = useMemo<ThemeModeContextValue>(
    () => ({
      mode,
      colorScheme: mode === 'auto' ? automaticScheme : mode,
      setMode,
      cycleMode: () => setMode((currentMode) => getNextMode(currentMode)),
    }),
    [automaticScheme, mode],
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
