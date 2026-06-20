import { Text as DefaultText, View as DefaultView } from 'react-native';

import { AppColorScheme } from '@/constants/Colors';
import { useColorScheme } from './useColorScheme';
import { useThemeMode } from './ThemeModeProvider';

type ThemeProps = {
  lightColor?: string;
  darkColor?: string;
};

export type TextProps = ThemeProps & DefaultText['props'];
export type ViewProps = ThemeProps & DefaultView['props'];

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof AppColorScheme,
) {
  const theme = useColorScheme();
  const { colors } = useThemeMode();
  const colorFromProps = props[theme];

  return colorFromProps ?? colors[colorName];
}

export function Text(props: TextProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return <DefaultText style={[{ color }, style]} {...otherProps} />;
}

export function View(props: ViewProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');

  return <DefaultView style={[{ backgroundColor }, style]} {...otherProps} />;
}
