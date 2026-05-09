# 05. Apple ログイン(フェーズ 2 / 保留)

> 関連: REQUIREMENTS.md §4.1.2, §7.1.2 / App Store Guideline 4.8

## ステータス

**フェーズ 2 に延期**。本チケットはフェーズ 1 では着手しない。理由は以下:

- iOS 提出自体をフェーズ 2 に延期する方針(Android 先行リリース)
- `expo-apple-authentication` は Expo Go で動作せず、開発体験を損なう
- Apple Developer Program(年額)契約のタイミングをフェーズ 2 まで遅らせたい

## フェーズ 2 着手時の TODO

- [ ] Apple Developer の App ID に「Sign In with Apple」capability を追加
- [ ] `expo-apple-authentication` を導入
- [ ] iOS のみボタンを表示(`Platform.OS === 'ios'` または `AppleAuthentication.isAvailableAsync()`)
- [ ] `signInAsync({ requestedScopes: [FULL_NAME, EMAIL] })` で `identityToken` を取得
- [ ] `useAuth` に `signInWithApple` を追加し、SecureStore に保存
- [ ] Workers 側 `verifyApple(identityToken)` を有効化(08 のチケットで雛形は用意済み)
- [ ] `app/(auth)/login.tsx` に Apple ボタンを追加(iOS のみ表示)

## フェーズ 2 移行時の受入基準

- iOS 実機でボタン → Apple ID 認証シート → `identityToken` 取得 → ホーム画面到達
- Android ではボタンが表示されない
- Workers で `aud === APPLE_BUNDLE_ID` が検証される

## 注意

iOS 提出時には Apple Sign In **必須**(Guideline 4.8)。Google ログインを iOS で出した瞬間にこのチケットは必須化する。Android のみ提出する間は不要。
