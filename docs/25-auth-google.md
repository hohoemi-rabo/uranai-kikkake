# 25. Google ログイン(本番)

> 関連: REQUIREMENTS.md §4.1.2, §7.1.1 / 04-auth-stub-dev.md

## 概要

スタブ認証(04)を本番の Google サインインに差し替える。**Web Client ID + PKCE 認可コードフロー**で認可コードを取得し、Workers 側でトークン交換して `id_token` を得る。

着手当初は `expo-auth-session/providers/google` を想定していたが、実機検証で行き詰まり(Android Client ID は Custom Tabs 非対応、`@react-native-google-signin` は EAS Free tier で OOM)、最終的に自前フローに切り替えた:

```
アプリ(Custom Tabs で認可画面)
  → GitHub Pages の HTTPS リダイレクトプロキシ(oauth/redirect.html)
  → custom scheme deep link で app/oauth/google/callback.tsx に戻る
  → code を Workers の POST /api/auth/google に送る
  → Workers が client_secret を足してトークン交換 → id_token を返す
```

経緯と落とし穴の詳細は `app/CLAUDE.md` / `workers/CLAUDE.md` の「チケット 25」節を参照。

このチケットは**フェーズ 1 の最後**に着手する。理由:

- google モードは custom scheme deep link を使うため Expo Go では動かない(Expo Go は `exp://` スキーム固定)
- 開発の大部分をスタブ認証で回したいので、機能実装が一通り終わってから着手する

## 前提

- [04. スタブ認証](./04-auth-stub-dev.md)
- [06. 認証コンテキスト](./06-auth-context-securestore.md)
- 機能チケット(11〜20)が一通り完了

## TODO

`[×]` = 完了 / `[ ] (手動)` = ユーザー手動操作 / `[ ] (本番時)` = 本番リリース時に実施

### クライアント実装

- [×] `lib/auth/google.ts`: `startGoogleSignIn()`(Custom Tabs で OAuth を開く)/ `completeGoogleSignIn()`(トークン交換)。`expo-web-browser` + `expo-crypto` で自前 PKCE(`expo-auth-session` は未使用、依存から削除済み)
- [×] `app/oauth/google/callback.tsx`: deep link `uranaikikkake://oauth/google/callback` を受ける専用 expo-router 画面
- [×] `oauth/redirect.html`: GitHub Pages 配信の HTTPS リダイレクトプロキシ(Google → custom scheme への JS 遷移)
- [×] `useAuth` に `signInWithSession(session)` 追加、`app/(auth)/login.tsx` で `EXPO_PUBLIC_AUTH_MODE` で stub / google を分岐
- [×] `app/(auth)/login.tsx` に「🔵 Google でログイン」ボタン(google モード時)
- [×] PKCE 検証値を SecureStore に永続化(OAuth 中の app kill 対策)
- [×] callback 二重マウント対策の二重実行ガード(`inFlightCompletion` Promise キャッシュ)
- [×] スタブ関連コードは `EXPO_PUBLIC_AUTH_MODE=stub` のときのみ実行(google ビルド時は stub 経路を通らない、grep 確認済み)

### Workers 実装

- [×] `POST /api/auth/google`: 認可コードのトークン交換(`GOOGLE_CLIENT_SECRET` を足して Google と交換し `idToken` を返す)
- [×] `provider === 'google'` の id_token 検証(チケット 08 で完成済み、本チケットで再確認)

### 設定(ユーザー手動)

- [×] (手動) Google Cloud Console で **Web** OAuth クライアント ID 発行 → [`25-google-cloud-setup.md`](./25-google-cloud-setup.md)(Android Client ID は最終設計では不要)
- [×] (手動) OAuth 同意画面のスコープ(`openid` / `profile` / `email`)設定 + テストユーザー登録
- [×] (手動) Web Client ID のリダイレクト URI に GitHub Pages の HTTPS URL を登録
- [×] (手動) `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` を `eas.json` の preview / production env に投入
- [×] (手動) dev Workers に `GOOGLE_CLIENT_IDS` / `GOOGLE_CLIENT_SECRET` を `wrangler secret put`
- [×] `wrangler.toml` の `[env.production]` に `DEV_BYPASS_ENABLED` を書かない(現状そのまま、stub バイパスは本番無効)

### 検証

- [×] (EAS Build 後) preview ビルドで実機テスト — Google ログイン成功、ホーム画面到達を確認

### フェーズ 2 / 本番リリース時

- [ ] (本番時) 本番 Workers に `GOOGLE_CLIENT_IDS` / `GOOGLE_CLIENT_SECRET` を投入(`--env production`)→ `docs/store/submission-checklist.md` で管理
- [ ] (本番時) production ビルド + 本番 Workers で実機の最終確認 → 同上
- iOS の URL Scheme 対応はフェーズ 2(`app.config.ts` の `scheme: 'uranaikikkake'` だけで Android は動く)

## 受入基準

- preview ビルド(実機)で Google アカウント選択 → アプリに戻り、エラーなくホーム画面に到達する ✅ 達成
- Workers が Google 公開鍵で `id_token` を正しく検証する(`/api/divine` が 401 にならない)
- 同一 Google アカウントで再ログインしても KV カウンターが継続する(sub ベース)
- スタブモード(`EXPO_PUBLIC_AUTH_MODE=stub`)に戻せば Expo Go でも動く

## 技術メモ

落とし穴の詳細は `app/CLAUDE.md` / `workers/CLAUDE.md` の「チケット 25」節に集約。ここではチケット固有の要点のみ:

- `id_token` の `aud` は **Web Client ID**(Google の token エンドポイントで `client_id=WEB_CLIENT_ID` を送るため)
- 「ウェブアプリケーション」型 OAuth クライアントは confidential client。**トークン交換に `client_secret` が必須**なので Workers 側で交換する(アプリには `client_secret` を持たせない)
- google モード着手後は **Expo Go で認証以降に進めなくなる**(custom scheme deep link が Expo Go では動かないため)。stub モードに戻せば Expo Go で動く
- フェーズ 1.1 以降の機能開発は `EXPO_PUBLIC_AUTH_MODE=stub`(`.env`)に戻すか、EAS Dev Client を常用する
- 当初想定した `expo-auth-session` / Android Client ID + SHA-1 登録は **最終設計では不要**(`expo-auth-session` は依存から削除済み、Android Client ID は登録が残っていても未使用)
