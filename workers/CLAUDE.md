# workers/CLAUDE.md

`workers/` 配下(Cloudflare Workers バックエンド)で作業するときのガイド。

## 役割

クライアントから `Authorization: Bearer {idToken}` で受けた診断リクエストを処理する:

1. `provider` に応じて ID トークンを検証(stub / google / apple)
2. KV カウンターで 1 日 3 回制限を強制
3. Gemini API を呼び出し
4. 結果と利用回数を返す

詳細フローは REQUIREMENTS §3, §4.4。各エンドポイントの実装はチケット 07〜10。

## 想定ファイル構成

```
workers/
├─ src/
│  ├─ index.ts      # ルーティング(POST /api/divine のみ)
│  ├─ auth.ts       # トークン検証(provider ディスパッチ)
│  ├─ kv.ts         # 利用回数カウンター
│  ├─ gemini.ts     # Gemini 呼び出し(リトライ・タイムアウト)
│  └─ prompts.ts    # charm / palm / match プロンプト + RESULT_SCHEMA
├─ wrangler.toml
└─ package.json
```

## wrangler 設定

- KV namespace バインド名は **`USAGE_KV`**(クライアントコードと整合)
- 環境を `[env.production]` で分離。dev は無印、本番は `--env production` で deploy
- `compatibility_date` は最新を指定(2026 時点なら `2026-05-01` 等)
- `[env.production]` には `DEV_BYPASS_ENABLED` を**書かない**(stub を完全に拒否するため)

## トークン検証(jose)

- `createRemoteJWKSet` で JWKS をメモリキャッシュ(再起動で消えるが OK)
- `jwtVerify(token, jwks, { issuer, audience })` で `iss` / `aud` / `exp` を検証
- `audience` は配列を渡せる(Google の iOS/Android/Web Client ID を全部許可)

```ts
import { createRemoteJWKSet, jwtVerify } from 'jose';

const jwks = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
const { payload } = await jwtVerify(idToken, jwks, {
  issuer: ['accounts.google.com', 'https://accounts.google.com'],
  audience: env.GOOGLE_CLIENT_IDS.split(','),
});
return { provider: 'google', sub: payload.sub! };
```

### stub バイパス(dev 専用)

`DEV_BYPASS_ENABLED === 'true'` の時のみ `provider: 'stub'` を許可:

- `idToken` が `dev-stub-token-` で始まる
- `X-Dev-Sub` ヘッダから `sub` を取得

本番 deploy では `DEV_BYPASS_ENABLED` を未設定にし、stub を完全に拒否。**コードに `if (isDev)` を書かない**(env で制御)。

## KV キー設計

```
key:    usage:{provider}:{sub}:{YYYY-MM-DD}
value:  { count: number, lastUsedAt: string }
TTL:    60*60*48 秒(48 時間)
```

- 日付は **JST**(`new Date(Date.now() + 9*3600*1000).toISOString().slice(0,10)`)
- TTL を 48 時間にすることで日跨ぎ後に自動削除
- `MAX_PER_DAY = 3` を定数化(REQUIREMENTS §4.2.1)

### 上限到達時のレスポンス(REQUIREMENTS §4.4.2)

```json
{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "今日はもう3回占いました。また明日会いましょう!",
  "resetAt": "2026-05-10T00:00:00+09:00"
}
```

`resetAt` は翌日 JST 00:00 を ISO 8601(`+09:00`)で返す。

### 同時リクエスト

KV は eventual consistency で atomicity が弱いが、3 回制限の目的なら誤差 1 回程度は許容範囲。厳密な ACID は不要。

## Gemini 呼び出し

- モデル: `gemini-3-flash-preview`(REQUIREMENTS §2.3)
- `generationConfig.responseSchema` に `RESULT_SCHEMA` を渡し JSON 強制
- リトライ最大 5 回、エクスポネンシャルバックオフ(0.5s → 1s → 2s → 4s → 8s)
- 429 / 5xx のみリトライ、4xx(認証等)は即時失敗
- 1 リクエスト 30 秒タイムアウト(`AbortController`)
- **失敗時は KV カウンターを増やさない**(ユーザー保護)

```ts
const ctrl = new AbortController();
const timer = setTimeout(() => ctrl.abort(), 30000);
try {
  const res = await fetch(GEMINI_URL, { signal: ctrl.signal, ... });
  // ...
} finally {
  clearTimeout(timer);
}
```

## CORS

- `Access-Control-Allow-Origin` はクライアント origin に限定(`*` にしない)
- `Allow-Headers`: `Authorization`、`Content-Type`、`X-Dev-Sub`(stub 用)
- プリフライト(`OPTIONS`)を必ずハンドル

## ログ取扱(プライバシー必須)

REQUIREMENTS §7.3 を厳守:

- **画像 base64 をログに出さない**(KV にも保存しない)
- `sub` は先頭 4 文字のみログ出力(個人識別を避ける)
- Gemini レスポンスもそのままログに出さない(本文に名前等が含まれる可能性)
- エラー時のスタックトレースに base64 が混入しないよう注意

## デプロイ

```bash
# dev 環境
wrangler deploy

# 本番環境
wrangler deploy --env production

# secret 投入
wrangler secret put GEMINI_API_KEY
wrangler secret put GOOGLE_CLIENT_IDS                       # カンマ区切り
wrangler secret put APPLE_BUNDLE_ID                         # フェーズ 2 で
wrangler secret put DEV_BYPASS_ENABLED                      # dev 環境のみ true
```

dev / 本番で同じ secret 名を使うが、**本番では `DEV_BYPASS_ENABLED` を投入しない**。

## チケット 07 完了時の知見

- **`wrangler init` は対話式なので CI/Claude 経由では使わない**: `package.json`・`wrangler.toml`・`tsconfig.json` を手書きする方が早い。空ディレクトリに `npm install` してから個別ファイルを作る順
- **KV namespace は手動 provisioning が必要**: `wrangler kv namespace create USAGE_KV` の出力 ID を `wrangler.toml` に貼り付ける。**dev / prod で別 ID を作って environment ごとにバインド**。本実装フェーズではプレースホルダ `__REPLACE_WITH_..._KV_ID__` のままコミットして、ユーザーが Cloudflare 認証完了後に書き換える運用
- **dev / prod の worker 名を分ける**: 同じ名前で deploy すると上書きされる。`name = "uranai-kikkake-api-dev"`(default)+ `[env.production].name = "uranai-kikkake-api"` の二段構え
- **CORS は Origin ヘッダの有無で分岐**: モバイル fetch・curl は Origin 無し → CORS ヘッダ不要で素通し / Origin あり許可済み → echo / Origin あり未許可 → プリフライト(`OPTIONS`)は 403、本体リクエストは CORS ヘッダ無しで返す(ブラウザ側がブロック)。`Access-Control-Allow-Origin: *` は **絶対に使わない**
- **`Vary: Origin` を必ず付ける**: 異なる origin への応答が CDN や中間キャッシュで取り違えられないように。CORS ヘッダを返す全てのレスポンスに同梱
- **`DEV_BYPASS_ENABLED` は `wrangler.toml` でなく secret**: 平文で repo に入れない。dev のみ `wrangler secret put DEV_BYPASS_ENABLED`(値: `true`)、本番では put しない
- **`compatibility_date` は固定値**: 自動更新しない(挙動が変わるとデバッグが難しくなる)。SDK 更新時に明示的に上げる
- **TypeScript 設定で `types: ["@cloudflare/workers-types"]` が必須**: `KVNamespace`・`ExportedHandler`・グローバル `Request`/`Response` が解決される。Node の `@types/node` を入れない(Workers ランタイムは Node ではない)
- **`wrangler dev` は Cloudflare 認証不要でローカル起動可能**: `wrangler.toml` の `id` がプレースホルダのままでもローカル KV エミュレーションで動く。プロビジョニングは `wrangler deploy` 時のみ必須

## チケット 08 完了時の知見

- **`jose` v6 は Workers の Web Crypto を自動利用**: 追加設定不要で `globalThis.fetch` + `crypto.subtle` が使われる。Node の `--experimental-fetch` 等は不要
- **JWKS は必ずモジュールスコープで singleton 化**: `createRemoteJWKSet(new URL(...))` をハンドラ内で呼ぶと毎リクエスト fetch が走り、レイテンシ悪化 + Google/Apple へのレートリミット発動。トップレベルで生成して Worker インスタンス内で再利用
- **`jose` の例外は `joseErrors.JOSEError` を継承**: `e.code`(`ERR_JWT_EXPIRED` / `ERR_JWS_INVALID` / `ERR_JWT_CLAIM_VALIDATION_FAILED` 等)で粒度の高い分類が可能。401 にまとめて返す前にログに `code` を出すとデバッグが楽
- **`AuthError.status` で 401 と 500 を分ける**: トークン不正は 401、サーバ設定不備(`GOOGLE_CLIENT_IDS` 未投入など)は 500。**クライアント `lib/api.ts` の 401 自動ログアウトを誤発火させない**ためにこの分離は重要
- **stub バイパスは `env.DEV_BYPASS_ENABLED === 'true'` の 1 箇所判定だけ**: `if (env.ENVIRONMENT === 'dev')` のような分岐はコードに **絶対に書かない**(env 名がリネームされた瞬間に本番で stub が通る事故が起きる)
- **`X-Dev-Sub` は stub 以外で読まない**: `provider !== 'stub'` の経路では `devSubHeader` 変数を一切使わない。Google トークン経由で偽の sub を注入できないようにする
- **`.dev.vars` の編集は wrangler dev 再起動が必要**: HMR では再読み込みされない。Ctrl+C → `npm run dev` で読み直す
- **ログには `maskSub(sub)`(先頭 4 文字 + `****`)**: 完全な sub をログに出さない(個人識別子の最小化、§7.3)。`console.log` は Cloudflare Logs に出るので生 sub は痕跡が残る
- **`req.json()` は 1 度しか呼べない**: ストリームが consume されるので、`provider` 抽出と後段の `mode`/`imageBase64` 抽出は **同じ body 変数から**取り出す。09/10 はその前提で body を `let body: { provider, mode, imageBase64 }` 形式に拡張する
- **`jose` の `audience` は配列で複数許可**: Google は iOS/Android/Web の 3 つの Client ID を全部許可する必要がある。`GOOGLE_CLIENT_IDS` をカンマ区切りで投入し、`.split(',')` で配列化して渡す
