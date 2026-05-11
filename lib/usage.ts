import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'usage_state_v1';

export type UsageState = {
  today: number;
  max: number;
  dateJst: string;
};

export function getJstDateClient(now: number = Date.now()): string {
  return new Date(now + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export async function loadUsageState(): Promise<UsageState | null> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as UsageState;
    if (
      typeof parsed.today === 'number' &&
      typeof parsed.max === 'number' &&
      typeof parsed.dateJst === 'string'
    ) {
      return parsed;
    }
  } catch {
    // 破損データ
  }
  return null;
}

export async function saveUsageState(state: UsageState): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(state));
}
