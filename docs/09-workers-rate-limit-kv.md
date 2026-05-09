# 09. KV 利用回数管理

> 関連: REQUIREMENTS.md §4.2

## 概要

Cloudflare KV にユーザー単位の日次カウンターを置き、1 日 3 回制限を強制する。

## 前提

- [08. ID トークン検証](./08-workers-token-verify.md)

## TODO

- [ ] `workers/src/kv.ts`: `getTodayKey(provider, sub)` で `usage:{provider}:{sub}:{YYYY-MM-DD}` を返す(JST)
- [ ] `getUsage(provider, sub)` で `{ count, lastUsedAt }` を取得(未存在は count=0)
- [ ] `incrementUsage(provider, sub)` で count+1、`expirationTtl: 60*60*48` を設定
- [ ] JST 日付計算: `new Date(Date.now() + 9*3600*1000)` ベースで `YYYY-MM-DD` を生成
- [ ] `MAX_PER_DAY = 3`(REQUIREMENTS §4.2.1)を定数化
- [ ] 上限到達時のレスポンス: 429 + `{ error: "RATE_LIMIT_EXCEEDED", message, resetAt }`
- [ ] `resetAt` は翌日 JST 00:00 を ISO 8601(`+09:00`)で返す

## 受入基準

- 4 回目のリクエストが 429 で返る
- 翌日 JST 00:00 を超えるとカウンターがリセットされる(KV TTL で自動削除)
- 別ユーザー(`sub` 違い)は独立してカウントされる

## 技術メモ

- `KV.get` は eventual consistency。1 リクエスト中で `get → put` を 2 回やっても古い値が見える可能性があるが、誤差 1 回程度は許容
- TTL を 48 時間にすることで深夜跨ぎでも安全
- 多重リクエスト(同時タップ)対策は不要(KV の atomicity は弱いが、3 回制限の目的なら誤差許容)
