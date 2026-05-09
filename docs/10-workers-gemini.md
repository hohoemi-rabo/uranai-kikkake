# 10. Gemini 連携(Workers)

> 関連: REQUIREMENTS.md §2.3, §4.4, §6.3, §12.4

## 概要

Workers から Gemini API(`gemini-3-flash-preview`)を呼び出し、構造化 JSON 出力を返す。リトライ・タイムアウトを実装。

## 前提

- [07. Workers ブートストラップ](./07-workers-bootstrap.md)
- [09. KV 利用回数管理](./09-workers-rate-limit-kv.md)
- [19. プロンプト](./19-prompts.md)(プロンプト本体)

## TODO

- [ ] `workers/src/gemini.ts`: `callGemini(mode, imageBase64)` を実装
- [ ] `RESULT_SCHEMA`(REQUIREMENTS §6.1)を定数化
- [ ] payload 構造(REQUIREMENTS §6.3)に従って `contents` + `generationConfig.responseSchema` を組む
- [ ] エクスポネンシャルバックオフでリトライ最大 5 回(初回 0.5s → 1s → 2s → 4s → 8s)
- [ ] HTTP 429 / 5xx のみリトライ、4xx(認証等)は即時失敗
- [ ] タイムアウト: 1 リクエスト 30 秒上限(`AbortController`)
- [ ] `/api/divine` ハンドラに統合: トークン検証 → KV チェック → Gemini → KV +1 → 結果返却
- [ ] 成功時レスポンスに `usage: { today, max }` を含める(REQUIREMENTS §4.4.2)
- [ ] Gemini 失敗時は 502 + `{ error: "GEMINI_FAILED" }` を返し、**KV カウンターは増やさない**

## 受入基準

- 実画像(base64)を投げると RESULT_SCHEMA の JSON が返る
- Gemini が一時的に 503 を返してもリトライで成功する
- Gemini が完全に失敗してもユーザーの利用回数は消費されない

## 技術メモ

- 画像は Workers のメモリに乗るが、レスポンス後は GC で消える。KV/R2 等に保存しない(REQUIREMENTS §7.3)
- ログに base64 を出さない(プライバシー)
- `responseSchema` を使うと Gemini が必ず JSON を返すので、`JSON.parse` 失敗ハンドラは最低限で OK
