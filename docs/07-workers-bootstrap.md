# 07. Workers ブートストラップ

> 関連: REQUIREMENTS.md §2.2, §3, §9 / CLAUDE.md「Workers の `wrangler secret`」

## 概要

Cloudflare Workers プロジェクトを `workers/` 配下に作成し、`wrangler` でデプロイ可能な状態にする。`/api/divine` のスケルトンエンドポイントを用意する。

## 前提

なし(クライアントと並行で着手可能)

## TODO

- [×] `workers/` ディレクトリ作成、TypeScript プロジェクト初期化(`wrangler init` は対話式なので使わず手書き)
- [×] `workers/wrangler.toml` を作成(`name`、`main`、`compatibility_date`、KV namespace バインド `USAGE_KV`)
- [×] `workers/src/index.ts` でルーティング(`POST /api/divine` のみ)
- [×] CORS ヘッダを返す(`Access-Control-Allow-Origin` はクライアントの origin に限定)
- [×] スケルトンレスポンス(固定 JSON)を返す段階で `wrangler dev` 動作確認
- [×] `wrangler secret put GEMINI_API_KEY` 等のドキュメント整備
- [×] dev / production 環境を分けるための `wrangler.toml` の `[env.production]` セクション追加
- [×] `workers/package.json` の `scripts` に `dev` / `deploy` / `deploy:prod`

## 受入基準

- `wrangler dev` でローカル起動 → `curl POST http://localhost:8787/api/divine` で固定 JSON が返る
- `wrangler deploy` で Cloudflare 上にデプロイされ、HTTPS で同じレスポンスが返る
- 不正な origin からの CORS プリフライトが弾かれる

## 技術メモ

- KV namespace ID は Cloudflare ダッシュボードまたは `wrangler kv namespace create USAGE_KV` で取得 → `wrangler.toml` に記入
- Workers は別リポジトリにしてもよいが、初期は同一リポの `workers/` 配下が運用しやすい
- `compatibility_date` は最新を指定(本実装では `2026-05-11`)
- `wrangler deploy` で実際に Cloudflare 上にデプロイ確認するステップは **ユーザー手元の作業**(Cloudflare アカウント認証が必要)。本リポの実装フェーズではローカル `wrangler dev` まで

## ユーザー側で実施するセットアップ手順

`workers/` 内で:

```bash
# 1. Cloudflare アカウントに認証(初回のみ)
npx wrangler login

# 2. KV namespace を作成(dev 用)
npx wrangler kv namespace create USAGE_KV
# 出力された id を wrangler.toml の [[kv_namespaces]] id に貼り付け

# 3. KV namespace を作成(prod 用)
npx wrangler kv namespace create USAGE_KV --env production
# 出力された id を [[env.production.kv_namespaces]] id に貼り付け

# 4. (ローカルでのプリフライト確認用)
echo 'ALLOWED_ORIGINS="http://localhost:8081"' > .dev.vars
npm run dev
# 別タブで:
#   curl -X POST http://localhost:8787/api/divine
#   curl -X OPTIONS -H "Origin: http://localhost:8081" -H "Access-Control-Request-Method: POST" http://localhost:8787/api/divine -i
#   curl -X OPTIONS -H "Origin: https://evil.example" -H "Access-Control-Request-Method: POST" http://localhost:8787/api/divine -i

# 5. dev デプロイ確認
npm run deploy
# → https://uranai-kikkake-api-dev.{subdomain}.workers.dev/api/divine

# 6. 必要な secret は 08〜10 着手時に投入(まだやらなくて良い)
npx wrangler secret put GEMINI_API_KEY
npx wrangler secret put GOOGLE_CLIENT_IDS         # カンマ区切り(iOS/Android/Web の Client ID)
npx wrangler secret put APPLE_BUNDLE_ID           # フェーズ 2(05)で
npx wrangler secret put DEV_BYPASS_ENABLED        # dev のみ、値: true
```

本番では `DEV_BYPASS_ENABLED` を投入しないこと(stub トークンが本番で通ってしまう)。
