import React from 'react';
import { Modal, Pressable, StyleSheet, TouchableOpacity, View as NativeView } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Text } from '@/components/Themed';
import { ThemeMode, useThemeMode } from './ThemeModeProvider';

const modes: { value: ThemeMode; label: string; icon: React.ComponentProps<typeof FontAwesome>['name'] }[] = [
  { value: 'auto', label: 'Auto', icon: 'clock-o' },
  { value: 'light', label: 'Jour', icon: 'sun-o' },
  { value: 'dark', label: 'Nuit', icon: 'moon-o' },
];

const modeLabels: Record<ThemeMode, string> = {
  auto: 'Auto',
  light: 'Jour',
  dark: 'Nuit',
};

const modeIcons: Record<ThemeMode, React.ComponentProps<typeof FontAwesome>['name']> = {
  auto: 'clock-o',
  light: 'sun-o',
  dark: 'moon-o',
};

export function ThemeModeButton() {
  const { mode, colors, setMode } = useThemeMode();
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <Pressable
        onPress={() => setIsOpen(true)}
        style={({ pressed }) => [
          styles.floatingButton,
          {
            borderColor: colors.border,
            backgroundColor: colors.surface,
            opacity: pressed ? 0.75 : 1,
            shadowColor: colors.text,
          },
        ]}
      >
        <FontAwesome name={modeIcons[mode]} color={colors.text} size={20} />
        <Text style={styles.floatingLabel}>{modeLabels[mode]}</Text>
      </Pressable>

      <Modal transparent visible={isOpen} animationType="fade" onRequestClose={() => setIsOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setIsOpen(false)}>
          <NativeView
            style={[
              styles.sheet,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                shadowColor: colors.text,
              },
            ]}
          >
            <Text style={styles.sheetTitle}>Thème</Text>
            {modes.map((themeMode) => {
              const isActive = mode === themeMode.value;

              return (
                <TouchableOpacity
                  key={themeMode.value}
                  style={[
                    styles.modeRow,
                    { borderColor: colors.border },
                    isActive && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                  activeOpacity={0.82}
                  onPress={() => {
                    setMode(themeMode.value);
                    setIsOpen(false);
                  }}
                >
                  <FontAwesome name={themeMode.icon} color={isActive ? '#fff' : colors.text} size={18} />
                  <Text style={[styles.modeText, isActive && styles.modeTextActive]}>{themeMode.label}</Text>
                  {isActive && <FontAwesome name="check" color="#fff" size={16} />}
                </TouchableOpacity>
              );
            })}
          </NativeView>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    right: 18,
    bottom: 92,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 6,
    zIndex: 30,
  },
  floatingLabel: {
    fontSize: 13,
    fontWeight: '800',
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
  },
  sheet: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 86,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 7,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 10,
  },
  modeRow: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modeText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  modeTextActive: {
    color: '#fff',
    fontWeight: '900',
  },
});
