import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Alert, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/hooks/useAuth';
import { clearOnboardingCompleted } from '@/lib/onboarding';

const PRIVACY_URL = 'https://hohoemi-rabo.github.io/uranai-kikkake/legal/privacy.html';
const TERMS_URL = 'https://hohoemi-rabo.github.io/uranai-kikkake/legal/terms.html';
const CONTACT_MAILTO =
  'mailto:rabo.hohoemi@gmail.com?subject=' +
  encodeURIComponent('占いキッカケのお問い合わせ');

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const version = Constants.expoConfig?.version ?? '1.0.0';

  const handleTerms = () => {
    WebBrowser.openBrowserAsync(TERMS_URL).catch(() => {
      Alert.alert('開けませんでした', 'もう一度お試しください。');
    });
  };

  const handlePrivacy = () => {
    WebBrowser.openBrowserAsync(PRIVACY_URL).catch(() => {
      Alert.alert('開けませんでした', 'もう一度お試しください。');
    });
  };

  const handleContact = () => {
    Linking.openURL(CONTACT_MAILTO).catch(() => {
      Alert.alert('メールアプリを開けませんでした', 'もう一度お試しください。');
    });
  };

  const handleShowOnboarding = () => {
    Alert.alert(
      'もう一度ご案内を表示します',
      'ご案内のあと、ホーム画面に戻ります。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '表示する',
          onPress: async () => {
            await clearOnboardingCompleted();
            router.replace('/(auth)/onboarding');
          },
        },
      ],
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'ログアウトしますか?',
      '次回起動時に再ログインが必要になります。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'ログアウト',
          style: 'destructive',
          onPress: () => {
            void signOut();
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-sky-50" edges={['top', 'bottom']}>
      <View className="flex-row items-center justify-between px-4 pt-2 pb-3">
        <Pressable onPress={() => router.back()} className="p-2 active:opacity-60">
          <Text className="text-base font-rounded-bold text-slate-700">← 戻る</Text>
        </Pressable>
        <Text className="text-lg font-rounded-bold text-slate-800">⚙️ 設定</Text>
        <View className="w-12" />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32, gap: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <Text className="text-sm font-rounded-bold text-slate-500 mb-2 ml-1">
            アプリについて
          </Text>
          <View className="bg-white rounded-2xl p-5">
            <Text className="text-xl font-rounded-bold text-slate-800">
              占いキッカケ
            </Text>
            <Text className="text-base font-rounded text-slate-500 mt-1">
              バージョン {version}
            </Text>
          </View>
        </View>

        <View>
          <Text className="text-sm font-rounded-bold text-slate-500 mb-2 ml-1">
            メニュー
          </Text>
          <View className="bg-white rounded-2xl overflow-hidden">
            <MenuRow label="📄  利用規約" onPress={handleTerms} />
            <MenuRow label="🔒  プライバシーポリシー" onPress={handlePrivacy} />
            <MenuRow label="✉️  お問い合わせ" onPress={handleContact} />
            <MenuRow label="🌟  はじめての方へ" onPress={handleShowOnboarding} isLast />
          </View>
        </View>

        <View>
          <Text className="text-sm font-rounded-bold text-slate-500 mb-2 ml-1">
            アカウント
          </Text>
          <View className="bg-white rounded-2xl overflow-hidden">
            <Pressable
              onPress={handleLogout}
              className="p-5 active:opacity-70"
            >
              <Text className="text-lg font-rounded-bold text-rose-500">
                🚪  ログアウト
              </Text>
            </Pressable>
          </View>
        </View>

        {/* フェーズ 1.1 で履歴・お気に入りを追加予定 */}
      </ScrollView>
    </SafeAreaView>
  );
}

type MenuRowProps = {
  label: string;
  onPress: () => void;
  isLast?: boolean;
};

function MenuRow({ label, onPress, isLast }: MenuRowProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center justify-between p-5 active:opacity-70 ${
        isLast ? '' : 'border-b border-slate-100'
      }`}
    >
      <Text className="text-lg font-rounded text-slate-800">{label}</Text>
      <Text className="text-xl text-slate-400">›</Text>
    </Pressable>
  );
}
