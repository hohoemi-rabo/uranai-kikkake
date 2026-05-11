# 10. Gemini 連携(Workers)

> 関連: REQUIREMENTS.md §2.3, §4.4, §6.3, §12.4

## 概要

Workers から Gemini API(`gemini-3-flash-preview`)を呼び出し、構造化 JSON 出力を返す。リトライ・タイムアウトを実装。

## 前提

- [07. Workers ブートストラップ](./07-workers-bootstrap.md)
- [09. KV 利用回数管理](./09-workers-rate-limit-kv.md)
- [19. プロンプト](./19-prompts.md)(プロンプト本体)

## TODO

- [×] `workers/src/gemini.ts`: `callGemini(mode, imageBase64)` を実装
- [×] `RESULT_SCHEMA`(REQUIREMENTS §6.1)を定数化
- [×] payload 構造(REQUIREMENTS §6.3)に従って `contents` + `generationConfig.responseSchema` を組む
- [×] エクスポネンシャルバックオフでリトライ最大 5 回(初回 0.5s → 1s → 2s → 4s → 8s)
- [×] HTTP 429 / 5xx のみリトライ、4xx(認証等)は即時失敗
- [×] タイムアウト: 1 リクエスト 30 秒上限(`AbortController`)
- [×] `/api/divine` ハンドラに統合: トークン検証 → KV チェック → Gemini → KV +1 → 結果返却
- [×] 成功時レスポンスに `usage: { today, max }` を含める(REQUIREMENTS §4.4.2)
- [×] Gemini 失敗時は 502 + `{ error: "GEMINI_FAILED" }` を返し、**KV カウンターは増やさない**

## 受入基準

- 実画像(base64)を投げると RESULT_SCHEMA の JSON が返る
- Gemini が一時的に 503 を返してもリトライで成功する
- Gemini が完全に失敗してもユーザーの利用回数は消費されない

## 技術メモ

- 画像は Workers のメモリに乗るが、レスポンス後は GC で消える。KV/R2 等に保存しない(REQUIREMENTS §7.3)
- ログに base64 を出さない(プライバシー)
- `responseSchema` を使うと Gemini が必ず JSON を返すので、`JSON.parse` 失敗ハンドラは最低限で OK
- **palm/match のプロンプト本体は本チケットでは簡素なプレースホルダ**: チケット 19 で Web 版から差し替える。10 では `responseSchema` 強制の API パイプラインが通ることだけを担保
- **実 Gemini 呼び出しの目視確認はユーザー手元**: `GEMINI_API_KEY` 取得・投入後に検証(下記セットアップ手順を参照)
- **1x1 ピクセルのダミー JPEG**: Gemini が拒否したり的外れな結果を返したりする可能性あり。実画像でテスト推奨
- **misconfig は 500、Gemini 失敗は 502**: クライアント `lib/api.ts` の 401 自動ログアウトとは別経路。10 では 401 と無関係に 500/502 を扱える前提

## ユーザー側で実施するセットアップ手順

```bash
# 1. Gemini API キーを取得
#    https://aistudio.google.com/app/apikey で無料発行(rate limit 内なら無料)

# 2. ローカル開発: workers/.dev.vars に追記
echo 'GEMINI_API_KEY="..."' >> workers/.dev.vars
cd workers && npm run dev   # 再起動が必要

# 3. dev Worker(Cloudflare 上)に投入
cd workers
npx wrangler secret put GEMINI_API_KEY
# プロンプトで API キーを貼り付け → 自動的に dev Worker に暗号化保存
npm run deploy

# 4. 本番 Worker への投入(本番リリース直前で OK)
npx wrangler secret put GEMINI_API_KEY --env production
npm run deploy:prod
```

### 動作確認手順(ローカル + 実 API キー)

```bash
HOST=http://localhost:8787
SUB=alice-uuid
# 実画像の base64 を準備(以下は例: 任意の JPEG をパイプ)
IMG=$(base64 -w0 < /path/to/face.jpg)

# 200 with result + usage
curl -sS -X POST $HOST/api/divine \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dev-stub-token-abc" \
  -H "X-Dev-Sub: $SUB" \
  -d "{\"provider\":\"stub\",\"mode\":\"charm\",\"imageBase64\":\"$IMG\"}"
```
