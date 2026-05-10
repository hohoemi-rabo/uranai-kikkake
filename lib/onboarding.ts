import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'onboarding_completed';

export async function getOnboardingCompleted(): Promise<boolean> {
  const value = await AsyncStorage.getItem(KEY);
  return value === 'true';
}

export async function setOnboardingCompleted(): Promise<void> {
  await AsyncStorage.setItem(KEY, 'true');
}

export async function clearOnboardingCompleted(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
