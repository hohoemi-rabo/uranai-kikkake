# 04. スタブ認証(開発用)

> 関連: REQUIREMENTS.md §4.1.2 / 25-auth-google.md(本番置換)

## 概要

Expo Go(`npx expo start --tunnel`)で全画面を試せるよう、ネイティブ Google / Apple SDK を使わない**ダミーの認証実装**を入れる。クライアント・Workers の両方に「開発用バイパス」を組み込み、製品実装(25)と差し替えやすい構造にしておく。

`expo-apple-authentication` や Google ネイティブ SDK は Expo Go で動作しないため、これらを後回しにすることでフェーズ 1 の大部分を Expo Go で開発できる。

## 前提

- [01. プロジェクト基盤](./01-project-foundation.md)

## TODO

### クライアント

- [ ] `src/lib/auth/stub.ts` に `signInStub(): Promise<{ idToken, provider, sub }>` を実装
  - `idToken`: 固定文字列(例: `dev-stub-token-{timestamp}`)
  - `provider`: `'stub'`
  - `sub`: 端末ごとに `expo-crypto` で生成しランダム ID を AsyncStorage に永続化(同一端末では同じ `sub`)
- [ ] `app/(auth)/login.tsx` のログインボタンを「(開発用)ログイン」に変更し `signInStub` を呼ぶ
- [ ] 製品実装に差し替えやすいよう、`useAuth().signIn(provider)` を `provider` 引数で分岐できる構造に
- [ ] 環境変数 `EXPO_PUBLIC_AUTH_MODE`(`stub` | `google`)で切替できる仕組みを用意(デフォルト `stub`)

### Workers 側

- [ ] `workers/src/auth.ts` の `verifyToken` で `provider === 'stub'` を検知
- [ ] Workers の secret `DEV_BYPASS_ENABLED`(`'true'` の時のみ stub を許可)を導入
- [ ] dev 環境(`wrangler.toml` の `[env.development]`)のみ `DEV_BYPASS_ENABLED=true`、本番では未設定
- [ ] stub トークンの検証ロジック: `idToken` プレフィックスが `dev-stub-token-` で始まる、かつヘッダ `X-Dev-Sub` で `sub` を受け取る
- [ ] 本番 deploy では DEV_BYPASS が効かないことを必ずテスト

## 受入基準

- Expo Go(`expo start --tunnel`)上でログインボタン → ホーム画面に到達できる
- 同一端末では再起動後も同じ `sub` で API を叩ける(KV カウンターが継続)
- 本番 Workers(`wrangler deploy`)では stub トークンが 401 で拒否される

## 技術メモ

- 製品の Google ログインを入れる時(チケット 25)は `EXPO_PUBLIC_AUTH_MODE=google` に切替えるだけで動くようにしておく
- stub の `sub` はランダム ID。Workers の KV キーは `usage:stub:{sub}:{date}` の形になる
- `provider: 'stub'` を製品コードに残さないよう、25 で差し替え時に grep して残骸を消す
