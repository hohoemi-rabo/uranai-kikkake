# 08. ID トークン検証(Workers)

> 関連: REQUIREMENTS.md §4.4.3, §7.1.3 / 04-auth-stub-dev.md

## 概要

クライアントから送られた `Authorization: Bearer {idToken}` を、`provider` に応じて検証する。フェーズ 1 では **stub** と **Google** を扱い、Apple はフェーズ 2 で有効化する。

## 前提

- [07. Workers ブートストラップ](./07-workers-bootstrap.md)

## TODO

- [×] `jose` を依存追加(Workers 互換)
- [×] `workers/src/auth.ts` に provider ディスパッチ関数 `verifyToken({ provider, idToken, devSubHeader })` を実装
- [×] **stub 検証**:
  - `DEV_BYPASS_ENABLED === 'true'` の時のみ有効化
  - `idToken` が `dev-stub-token-` で始まる
  - `X-Dev-Sub` ヘッダから `sub` を取得
  - 本番環境では `DEV_BYPASS_ENABLED` を未設定にし、stub を完全に拒否
- [×] **Google 検証**(チケット 25 で本番投入):
  - `https://www.googleapis.com/oauth2/v3/certs` を `createRemoteJWKSet` でキャッシュ
  - `iss`: `accounts.google.com` か `https://accounts.google.com`
  - `aud`: `GOOGLE_CLIENT_IDS`(カンマ区切り) を許容リストとして
  - `exp` 失効チェック(`jose` のデフォルト)
- [×] **Apple 検証**(フェーズ 2 で有効化、雛形のみ):
  - `https://appleid.apple.com/auth/keys` の JWKS
  - `iss`: `https://appleid.apple.com`
  - `aud`: `APPLE_BUNDLE_ID`
- [×] 401 を返すケース: ヘッダ欠落 / 検証失敗 / `provider` と `iss` の不一致 / stub が許可されていない環境
- [×] 検証成功で `{ provider, sub }` を返す関数として API ハンドラから呼ぶ
- [×] ログには `sub` の先頭 4 文字のみ出す(個人識別を避ける)

## 受入基準

- dev 環境で stub トークンが通り、本番 deploy では拒否される
- 有効な Google id_token を渡すと `sub` が返る(チケット 25 で実 API 検証)
- 期限切れ・改ざん・別 audience のトークンは 401 で拒否される
- Apple のコードパスは存在するが、フェーズ 2 まで未使用でもビルドが通る

## 技術メモ

- `jose` の `jwtVerify` は `audience` に配列を渡せる(Google の iOS/Android/Web Client ID を全部許可)
- JWKS のキャッシュは `createRemoteJWKSet` がメモリで保持。Workers 再起動で消えるが問題ない
- stub と本番を切り替える境目は **`wrangler.toml` の env 別 `DEV_BYPASS_ENABLED`** のみ。コードに `if (isDev)` を書かない
- **Google の有効な id_token 検証は本チケットでは未テスト**: 実際の検証はチケット 25(本番 Google ログイン)着手時に行う。08 ではコードパスと JWKS fetch 設定が動くこと、無効トークンが 401 で弾かれることを確認するに留まる
- **Apple のコードパスも完全実装済み**: `provider: 'apple'` で呼べば JWKS 検証が走る。フェーズ 2 でクライアントが `provider: 'apple'` を送るようになれば追加実装不要

## ユーザー側で実施するセットアップ手順

`workers/` 内で:

```bash
# 1. ローカル開発: .dev.vars に DEV_BYPASS_ENABLED を追記
echo 'DEV_BYPASS_ENABLED="true"' >> .dev.vars
npm run dev   # 再起動時に Using secrets defined in .dev.vars と表示される

# 2. dev Worker(Cloudflare 上)で stub を使いたい場合
npx wrangler secret put DEV_BYPASS_ENABLED   # プロンプトで true と入力
npm run deploy

# 3. 本番 Worker には絶対に投入しない
#   npx wrangler secret put DEV_BYPASS_ENABLED --env production    ← やらない
#   これを実行すると本番で stub トークンが通ってしまう

# 4. Google 検証を本番で使う準備(25 着手時)
npx wrangler secret put GOOGLE_CLIENT_IDS   # カンマ区切り(iOS/Android/Web の Client ID 全部)
```

`.dev.vars` の編集は HMR で反映されないので、wrangler dev を Ctrl+C で停止して再起動すること。
