# 04. スタブ認証(開発用)

> 関連: REQUIREMENTS.md §4.1.2 / 25-auth-google.md(本番置換)

## 概要

Expo Go(`npx expo start --tunnel`)で全画面を試せるよう、ネイティブ Google / Apple SDK を使わない**ダミーの認証実装**を入れる。クライアント・Workers の両方に「開発用バイパス」を組み込み、製品実装(25)と差し替えやすい構造にしておく。

`expo-apple-authentication` や Google ネイティブ SDK は Expo Go で動作しないため、これらを後回しにすることでフェーズ 1 の大部分を Expo Go で開発できる。

## 前提

- [01. プロジェクト基盤](./01-project-foundation.md)

## TODO

### クライアント

- [×] `lib/auth/stub.ts` に `signInStub(): Promise<{ idToken, provider, sub }>` を実装
  - `idToken`: `dev-stub-token-{Date.now()}`
  - `provider`: `'stub'`
  - `sub`: `expo-crypto` の `Crypto.randomUUID()` で生成し AsyncStorage(`auth_stub_sub`)に永続化(同一端末では同じ `sub`)
- [×] `app/(auth)/login.tsx` のログインボタンを「(開発用)ログイン」とし `signIn()` を呼ぶ
- [×] 製品実装に差し替えやすいよう、`signIn(provider)` を `provider` 引数で分岐できる構造(`lib/auth/signIn.ts`)。06 の `useAuth().signIn(provider)` から呼ばれる
- [×] 環境変数 `EXPO_PUBLIC_AUTH_MODE`(`stub` | `google`)で切替(`process.env.EXPO_PUBLIC_AUTH_MODE ?? 'stub'`、`.env` 未配置でも動作)

### Workers 側 — **チケット 08 で実装**

`07 Workers ブートストラップ` 後の `08 ID トークン検証` で本格実装。INDEX 順を崩さないため 04 では保留。仕様(プロトコル定義)は以下:

- [ ] `workers/src/auth.ts` の `verifyToken` で `provider === 'stub'` を検知 → **08 で実装**
- [ ] Workers の secret `DEV_BYPASS_ENABLED`(`'true'` の時のみ stub を許可)を導入 → **08 で実装**
- [ ] dev 環境(`wrangler.toml` の `[env.development]`)のみ `DEV_BYPASS_ENABLED=true`、本番では未設定 → **08 で実装**
- [ ] stub トークンの検証ロジック: `idToken` プレフィックスが `dev-stub-token-` で始まる、かつヘッダ `X-Dev-Sub` で `sub` を受け取る → **08 で実装**
- [ ] 本番 deploy では DEV_BYPASS が効かないことを必ずテスト → **08 で実装**

## スコープ境界

| 04(本チケット) | 06(認証コンテキスト) | 08(Workers 検証) |
|------------------|------------------------|---------------------|
| `signInStub()` 関数本体 / `(auth)` グループ作成 / login 画面 / `signIn()` ディスパッチャ | `useAuth` Context / SecureStore 永続化 / `(auth)`/`(main)` ガード / 401 自動ログアウト | `verifyToken` / `DEV_BYPASS_ENABLED` / `X-Dev-Sub` ヘッダ受信 / 本番拒否 |

## 受入基準(クライアント部分のみ。Workers 部分は 08 で再評価)

- Expo Go(`expo start --tunnel`)上で「(開発用)ログイン」 → ホーム画面に到達できる
- `signInStub()` を 2 回呼ぶと同じ `sub` を返す(AsyncStorage キャッシュ)
- 本番 Workers では stub トークン 401 → **08 で確認**

## 技術メモ

- 製品の Google ログインを入れる時(チケット 25)は `lib/auth/signIn.ts` の分岐に `signInGoogle()` を追加するだけ。`EXPO_PUBLIC_AUTH_MODE=google` 時に切替
- stub の `sub` はランダム UUID。Workers の KV キーは `usage:stub:{sub}:{date}` の形になる
- `provider: 'stub'` を製品コードに残さないよう、25 で差し替え時に grep して残骸を消す
- ログイン後の認証状態保持は **チケット 06** で実装。04 段階ではリロードすると認証状態が消えるが想定内
