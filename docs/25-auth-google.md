# 25. Google ログイン(本番)

> 関連: REQUIREMENTS.md §4.1.2, §7.1.1 / 04-auth-stub-dev.md

## 概要

スタブ認証(04)を本番の Google サインインに差し替える。`expo-auth-session/providers/google` を使い、`id_token` を取得して Workers に投げる。

このチケットは**フェーズ 1 の最後の方**に着手する。理由:

- Google ネイティブ SDK が入ると Expo Go で動かなくなり、`expo start --tunnel` が使えなくなる
- 開発の大部分をスタブ認証で回したいので、機能実装が一通り終わってから着手する

## 前提

- [04. スタブ認証](./04-auth-stub-dev.md)
- [06. 認証コンテキスト](./06-auth-context-securestore.md)
- 機能チケット(11〜20)が一通り完了

## TODO

- [ ] Google Cloud Console で OAuth クライアント ID(iOS / Android / Web)を発行
- [ ] `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` / `_ANDROID_CLIENT_ID` / `_WEB_CLIENT_ID` を `.env` / EAS Build profile に設定
- [ ] `expo-auth-session` + `expo-crypto` + `expo-web-browser` を導入
- [ ] `src/lib/auth/google.ts` で `useAuthRequest` フックをラップした `useGoogleSignIn` を作成
- [ ] iOS の URL Scheme `com.googleusercontent.apps.{ID}` を `app.config.ts` の `ios.urlScheme` に登録
- [ ] Android: EAS Build のキーストア SHA-1 を Google Cloud に登録
- [ ] `useAuth` を `EXPO_PUBLIC_AUTH_MODE` で stub / google を分岐させる(04 で用意済み)
- [ ] `app/(auth)/login.tsx` のボタン文言を「Google でログイン」に戻す
- [ ] Workers 側で `provider === 'google'` を有効化(08 で雛形済み)、`DEV_BYPASS_ENABLED` を本番で外す
- [ ] **dev client / EAS Build で実機テスト**(Expo Go では動かなくなる)
- [ ] スタブ関連コード(`provider: 'stub'`、`DEV_BYPASS_ENABLED`)を本番ビルドから除去できているか grep で確認

## 受入基準

- 開発ビルド(EAS Dev Client)で Google アカウント選択 → アプリに戻り `id_token` が取れる
- Workers が Google 公開鍵で正しく検証する
- 同一 Google アカウントで再ログインしても KV カウンターが継続する
- スタブモード(`EXPO_PUBLIC_AUTH_MODE=stub`)に戻せば Expo Go でも動く

## 技術メモ

- `id_token` の `aud` は **Web Client ID** が入る(iOS/Android Client ID ではない)
- 本チケット完了後は **Expo Go では認証画面以降に進めなくなる**。チームに告知すること
- フェーズ 1.1 以降の機能開発は `EXPO_PUBLIC_AUTH_MODE=stub` に戻すか、EAS Dev Client を常用する
