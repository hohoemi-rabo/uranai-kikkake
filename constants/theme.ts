export const Colors = {
  charm: '#FB7185',
  palm: '#2DD4BF',
  match: '#FB923C',
  background: '#1E1B4B',
  shareCanvas: '#F5F3FF',
  card: '#FFFFFF',
  cardAlt: '#F8FAFC',
  luckyItem: '#FFFBEB',
  advice: '#ECFDF5',
  textPrimary: '#0F172A',
  textSecondary: '#1E293B',
  textMuted: '#64748B',
  textSubtle: '#475569',
  onBg: '#F8FAFC',
  onBgMuted: '#CBD5E1',
  onBgSubtle: '#94A3B8',
} as const;

export const BackgroundGradient = {
  colors: ['#1E1B4B', '#581C87', '#831843'] as const,
  start: { x: 0, y: 0 },
  end: { x: 0, y: 1 },
} as const;

export type TabKey = 'charm' | 'palm' | 'match';

export const TabAccent: Record<TabKey, string> = {
  charm: Colors.charm,
  palm: Colors.palm,
  match: Colors.match,
};

export function isTabKey(v: unknown): v is TabKey {
  return v === 'charm' || v === 'palm' || v === 'match';
}

export const Fonts = {
  rounded: 'MPLUSRounded1c_400Regular',
  roundedBold: 'MPLUSRounded1c_700Bold',
  roundedBlack: 'MPLUSRounded1c_900Black',
} as const;
