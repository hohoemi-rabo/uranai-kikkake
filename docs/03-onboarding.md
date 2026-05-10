# 03. オンボーディング

> 関連: REQUIREMENTS.md §4.1.1, §5.5

## 概要

初回起動時のオンボーディング(3〜4 スライド)を実装。ログイン画面の前に表示し、設定画面から再表示できるようにする。

## 前提

- [01. プロジェクト基盤](./01-project-foundation.md)

## TODO

- [×] ~~`app/(auth)/onboarding.tsx`~~ → **`app/onboarding.tsx`(Stack 直下)に仮置**(チケット 04 で `(auth)/_layout.tsx` 作成と同時に `(auth)/onboarding.tsx` に移動)。4 スライド + 横スワイプ補助
- [×] スライド内容: (1)あなたの魅力、見つけてみよう / (2)楽しむための占いです(エンターテイメント明示)/ (3)スマホでお楽しみください / (4)はじめましょう
- [×] AsyncStorage に `onboarding_completed` フラグを保存(`lib/onboarding.ts` の `getOnboardingCompleted` / `setOnboardingCompleted` / `clearOnboardingCompleted` で集中管理)
- [×] ルート `_layout.tsx` で初回判定 → 未完了なら `/onboarding` へ Redirect(フォントロードと並行で待機、両方揃うまで splash 維持)
- [×] 「次へ」「はじめる」ボタンは `p-5` `text-lg` 以上、`bg-charm` アクセント(シニア配慮)
- [×] スワイプは `react-native-reanimated` の `useSharedValue` + `withTiming` で translateX、`react-native-gesture-handler` の `Gesture.Pan()` で水平スワイプ受信。`Stack.Screen options.gestureEnabled: false` でスワイプバック禁止

## 受入基準

- 初回起動時のみオンボーディングが表示される(`app/_layout.tsx` の Redirect)
- AsyncStorage クリアで再度表示される。設定画面の「はじめての方へ」再表示ボタンは **チケット 20 のスコープ**。03 では `clearOnboardingCompleted()` を export しておく
- 「エンタメ」表記が明確(スライド 2 のタイトル「楽しむための占いです」+ 本文「このアプリはエンターテイメントです」)

## 技術メモ

- 通知許可リクエストは行わない(REQUIREMENTS §5.3 の方針)
- スライド数は最大 4 まで。シニアが疲れる前に終わらせる
- スキップボタンは入れない(シニア向けは混乱の元)
- ファイル配置: フェーズ 1 では `app/onboarding.tsx`(Stack 直下)、チケット 04 で `(auth)/onboarding.tsx` に移動
- `GestureHandlerRootView` で root をラップ(`app/_layout.tsx`)。これがないと `Gesture.Pan()` が反応しない
