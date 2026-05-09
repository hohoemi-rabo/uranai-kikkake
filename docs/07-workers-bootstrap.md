# 07. Workers ブートストラップ

> 関連: REQUIREMENTS.md §2.2, §3, §9 / CLAUDE.md「Workers の `wrangler secret`」

## 概要

Cloudflare Workers プロジェクトを `workers/` 配下に作成し、`wrangler` でデプロイ可能な状態にする。`/api/divine` のスケルトンエンドポイントを用意する。

## 前提

なし(クライアントと並行で着手可能)

## TODO

- [ ] `workers/` ディレクトリ作成、`wrangler init` で TypeScript プロジェクト生成
- [ ] `workers/wrangler.toml` を作成(`name`、`main`、`compatibility_date`、KV namespace バインド `USAGE_KV`)
- [ ] `workers/src/index.ts` でルーティング(`POST /api/divine` のみ)
- [ ] CORS ヘッダを返す(`Access-Control-Allow-Origin` はクライアントの origin に限定)
- [ ] スケルトンレスポンス(固定 JSON)を返す段階で `wrangler dev` 動作確認
- [ ] `wrangler secret put GEMINI_API_KEY` 等のドキュメント整備
- [ ] dev / production 環境を分けるための `wrangler.toml` の `[env.production]` セクション追加
- [ ] `workers/package.json` の `scripts` に `dev` / `deploy` / `deploy:prod`

## 受入基準

- `wrangler dev` でローカル起動 → `curl POST http://localhost:8787/api/divine` で固定 JSON が返る
- `wrangler deploy` で Cloudflare 上にデプロイされ、HTTPS で同じレスポンスが返る
- 不正な origin からの CORS プリフライトが弾かれる

## 技術メモ

- KV namespace ID は Cloudflare ダッシュボードから手動取得 → `wrangler.toml` に記入
- Workers は別リポジトリにしてもよいが、初期は同一リポの `workers/` 配下が運用しやすい
- `compatibility_date` は最新を指定(2026-05 時点なら `2026-05-01` 等)
