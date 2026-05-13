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

`[×]` = Claude 実装完了 / `[ ] (手動)` = ユーザー手動操作 / `[ ] (EAS Build 後)` = 実機テスト後完了

- [ ] (手動) Google Cloud Console で OAuth クライアント ID(Web / Android × 2)を発行 → [`25-google-cloud-setup.md`](./25-google-cloud-setup.md) 参照(iOS はフェーズ 2)
- [ ] (手動) `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` / `_WEB_CLIENT_ID` を `eas.json` の preview / production env に投入
- [×] `expo-auth-session` を導入(`expo-crypto` / `expo-web-browser` は既存)
- [×] `lib/auth/google.ts` で `useAuthRequest` フックをラップした `useGoogleSignIn` を作成(callback API)
- iOS の URL Scheme: **フェーズ 2 で対応**(`app.config.ts` の `scheme: 'uranaikikkake'` だけで Android は動く)
- [ ] (手動) Android: EAS Build のキーストア SHA-1 を Google Cloud に登録(初回 `eas build --profile development --platform android` 後に `eas credentials -p android` で取得)
- [×] `useAuth` に `signInWithSession(session)` 追加、`app/(auth)/login.tsx` で `EXPO_PUBLIC_AUTH_MODE` で stub / google を分岐
- [×] `app/(auth)/login.tsx` に「🔵 Google でログイン」ボタン(google モード時)
- [×] Workers 側 `provider === 'google'`(チケット 08 で完成済み、本チケットで再確認)
- [ ] (手動) `wrangler secret put GOOGLE_CLIENT_IDS --env production` で Workers 本番に Web Client ID 投入
- [ ] (手動) `wrangler.toml` の `[env.production]` に `DEV_BYPASS_ENABLED` を **書かない**(現状そのまま、stub バイパスは本番で無効)
- [ ] (EAS Build 後) **dev client / EAS Build で実機テスト**(Expo Go では動かなくなる)
- [×] スタブ関連コードは `EXPO_PUBLIC_AUTH_MODE=stub` のときのみ実行される構造(本番 google ビルド時は stub 経路通らない、grep 確認済み)

## 受入基準

- 開発ビルド(EAS Dev Client)で Google アカウント選択 → アプリに戻り `id_token` が取れる
- Workers が Google 公開鍵で正しく検証する
- 同一 Google アカウントで再ログインしても KV カウンターが継続する
- スタブモード(`EXPO_PUBLIC_AUTH_MODE=stub`)に戻せば Expo Go でも動く

## 技術メモ

- `id_token` の `aud` は **Web Client ID** が入る(iOS/Android Client ID ではない)
- 本チケット完了後は **Expo Go では認証画面以降に進めなくなる**(google モード時)。stub モードに戻せば Expo Go で動く
- フェーズ 1.1 以降の機能開発は `EXPO_PUBLIC_AUTH_MODE=stub`(`.env`)に戻すか、EAS Dev Client を常用する
- **`useGoogleSignIn` は React Hook なので関数 API には包めない**: `signIn.ts` の関数チェーンとは別ルートで login 画面が直接呼ぶ + `useAuth().signInWithSession(session)` で完了する分離構造
- **Hooks rule 準拠の分離コンポーネント**: `GoogleLoginButton` と `StubLoginButton` を別コンポーネントにして、AUTH_MODE で切り替え
- **id_token の sub 取得は自前 base64url decode**(`lib/auth/google.ts:decodeJwtPayload`)。`jose` は Workers 側だけで使う(クライアントには不要)
- **Android 用パッケージ名は dev/prod の 2 種類**: `jp.hohoemirabo.uranaikikkake` / `jp.hohoemirabo.uranaikikkake.dev`(`app.config.ts:18,21`)。Google Cloud Console で **2 つの Android Client ID** を作って SHA-1 をそれぞれ登録するのが分かりやすい
- **`WebBrowser.maybeCompleteAuthSession()` をモジュールトップで呼ぶ**: redirect 後のアプリ復帰時にブラウザを閉じる必須処理。`lib/auth/google.ts:7` で呼んでいる
- **Client ID は機密ではない**(audience 識別子)。`EXPO_PUBLIC_*` で JS バンドルに展開しても OK。Client Secret は Public Client(モバイル)では使わない
