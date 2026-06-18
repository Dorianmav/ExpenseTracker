import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { Text } from '@/components/Themed';
import { useThemeMode } from './ThemeModeProvider';

const modeLabels = {
  auto: 'Auto',
  light: 'Jour',
  dark: 'Nuit',
};

const modeIcons = {
  auto: 'clock-o',
  light: 'sun-o',
  dark: 'moon-o',
} as const;

export function ThemeModeButton() {
  const { mode, colorScheme, cycleMode } = useThemeMode();
  const colors = Colors[colorScheme];

  return (
    <Pressable
      onPress={cycleMode}
      style={({ pressed }) => [
        styles.button,
        { borderColor: colors.border, backgroundColor: colors.surface, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <FontAwesome name={modeIcons[mode]} color={colors.text} size={14} />
      <Text style={styles.text}>{modeLabels[mode]}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 12,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
});
