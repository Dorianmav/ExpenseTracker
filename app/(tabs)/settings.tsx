import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { palettes, PaletteName } from '@/constants/Colors';
import { Text, View, useThemeColor } from '@/components/Themed';
import { ThemeMode, useThemeMode } from '@/components/ThemeModeProvider';

const themeModes: { label: string; value: ThemeMode; icon: React.ComponentProps<typeof FontAwesome>['name'] }[] = [
  { label: 'Auto', value: 'auto', icon: 'clock-o' },
  { label: 'Jour', value: 'light', icon: 'sun-o' },
  { label: 'Nuit', value: 'dark', icon: 'moon-o' },
];

export default function SettingsScreen() {
  const { mode, paletteName, setMode, setPaletteName, colors } = useThemeMode();
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const mutedColor = useThemeColor({}, 'muted');

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Paramètres admin</Text>
      <Text style={[styles.subtitle, { color: mutedColor }]}>
        Espace réservé à l'administrateur pour ajuster le rendu de l'application.
      </Text>

      <Text style={styles.sectionTitle}>Mode d'affichage</Text>
      <View style={styles.modeGrid}>
        {themeModes.map((themeMode) => {
          const isActive = mode === themeMode.value;

          return (
            <TouchableOpacity
              key={themeMode.value}
              style={[
                styles.modeButton,
                { backgroundColor: cardColor, borderColor },
                isActive && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
              onPress={() => setMode(themeMode.value)}
            >
              <FontAwesome name={themeMode.icon} size={18} color={isActive ? '#fff' : colors.text} />
              <Text style={isActive ? styles.activeButtonText : styles.buttonText}>{themeMode.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.sectionTitle}>Palette de couleurs</Text>
      {(Object.keys(palettes) as PaletteName[]).map((name) => {
        const palette = palettes[name];
        const isActive = paletteName === name;
        const preview = palette.dark;

        return (
          <TouchableOpacity
            key={name}
            style={[
              styles.paletteCard,
              { backgroundColor: cardColor, borderColor },
              isActive && { borderColor: colors.primary },
            ]}
            onPress={() => setPaletteName(name)}
          >
            <View style={[styles.paletteHeader, { backgroundColor: cardColor }]}>
              <View lightColor={cardColor} darkColor={cardColor}>
                <Text style={styles.paletteTitle}>{palette.label}</Text>
                <Text style={[styles.paletteDescription, { color: mutedColor }]}>{palette.description}</Text>
              </View>
              {isActive && <FontAwesome name="check-circle" color={colors.primary} size={22} />}
            </View>
            <View style={[styles.swatches, { backgroundColor: cardColor }]}>
              <View style={[styles.swatch, { backgroundColor: preview.background }]} />
              <View style={[styles.swatch, { backgroundColor: preview.card }]} />
              <View style={[styles.swatch, { backgroundColor: preview.primary }]} />
              <View style={[styles.swatch, { backgroundColor: preview.secondary }]} />
              <View style={[styles.swatch, { backgroundColor: preview.danger }]} />
              <View style={[styles.swatch, { backgroundColor: preview.success }]} />
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 48,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  modeGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  modeButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 6,
  },
  buttonText: {
    fontWeight: '700',
  },
  activeButtonText: {
    color: '#fff',
    fontWeight: '800',
  },
  paletteCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  paletteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  paletteTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  paletteDescription: {
    marginTop: 3,
  },
  swatches: {
    flexDirection: 'row',
    gap: 8,
  },
  swatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
});
