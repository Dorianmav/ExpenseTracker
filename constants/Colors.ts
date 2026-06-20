export type PaletteName = 'premium' | 'apple' | 'bank';

export type AppColorScheme = {
  text: string;
  background: string;
  surface: string;
  card: string;
  cardHover: string;
  border: string;
  muted: string;
  primary: string;
  secondary: string;
  danger: string;
  success: string;
  income: string;
  tint: string;
  tabIconDefault: string;
  tabIconSelected: string;
  calendarBackground: string;
};

export type AppPalette = {
  label: string;
  description: string;
  light: AppColorScheme;
  dark: AppColorScheme;
};

export const palettes: Record<PaletteName, AppPalette> = {
  premium: {
    label: 'Fintech premium',
    description: 'Revolut / Copilot Money',
    light: {
      background: '#F8FAFC',
      surface: '#FFFFFF',
      card: '#FFFFFF',
      cardHover: '#F1F5F9',
      text: '#0F172A',
      muted: '#64748B',
      primary: '#0284C7',
      secondary: '#6366F1',
      danger: '#DC2626',
      success: '#16A34A',
      income: '#16A34A',
      border: '#E2E8F0',
      tint: '#0284C7',
      tabIconDefault: '#94A3B8',
      tabIconSelected: '#0284C7',
      calendarBackground: '#FFFFFF',
    },
    dark: {
      background: '#0B1220',
      surface: '#111827',
      card: '#1E293B',
      cardHover: '#334155',
      text: '#F8FAFC',
      muted: '#94A3B8',
      primary: '#38BDF8',
      secondary: '#6366F1',
      danger: '#EF4444',
      success: '#22C55E',
      income: '#22C55E',
      border: '#334155',
      tint: '#38BDF8',
      tabIconDefault: '#64748B',
      tabIconSelected: '#38BDF8',
      calendarBackground: '#1E293B',
    },
  },
  apple: {
    label: 'Apple / Copilot',
    description: 'iOS propre et lumineux',
    light: {
      background: '#F5F7FA',
      surface: '#FFFFFF',
      card: '#FFFFFF',
      cardHover: '#EEF2F7',
      text: '#111827',
      muted: '#6B7280',
      primary: '#007AFF',
      secondary: '#5856D6',
      danger: '#FF453A',
      success: '#30D158',
      income: '#30D158',
      border: '#E5E7EB',
      tint: '#007AFF',
      tabIconDefault: '#9CA3AF',
      tabIconSelected: '#007AFF',
      calendarBackground: '#FFFFFF',
    },
    dark: {
      background: '#0F1117',
      surface: '#121620',
      card: '#181C25',
      cardHover: '#242A36',
      text: '#FFFFFF',
      muted: '#9CA3AF',
      primary: '#5AC8FA',
      secondary: '#7C83FF',
      danger: '#FF6B6B',
      success: '#34D399',
      income: '#34D399',
      border: '#2B3140',
      tint: '#5AC8FA',
      tabIconDefault: '#6B7280',
      tabIconSelected: '#5AC8FA',
      calendarBackground: '#181C25',
    },
  },
  bank: {
    label: 'Banque moderne',
    description: 'N26 / fintech européenne',
    light: {
      background: '#FAFAFA',
      surface: '#FFFFFF',
      card: '#FFFFFF',
      cardHover: '#F4F4F5',
      text: '#171717',
      muted: '#737373',
      primary: '#00BFA6',
      secondary: '#2563EB',
      danger: '#E5484D',
      success: '#00D084',
      income: '#00D084',
      border: '#E5E5E5',
      tint: '#00BFA6',
      tabIconDefault: '#A3A3A3',
      tabIconSelected: '#00BFA6',
      calendarBackground: '#FFFFFF',
    },
    dark: {
      background: '#0A0A0A',
      surface: '#111111',
      card: '#171717',
      cardHover: '#262626',
      text: '#FFFFFF',
      muted: '#A3A3A3',
      primary: '#00BFA6',
      secondary: '#38BDF8',
      danger: '#FF5D5D',
      success: '#00D084',
      income: '#00D084',
      border: '#2A2A2A',
      tint: '#00BFA6',
      tabIconDefault: '#737373',
      tabIconSelected: '#00BFA6',
      calendarBackground: '#171717',
    },
  },
};

export const defaultPaletteName: PaletteName = 'premium';

export default {
  light: palettes[defaultPaletteName].light,
  dark: palettes[defaultPaletteName].dark,
};
