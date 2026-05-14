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
wrangler secret put GOOGLE_CLIENT_IDS                       # カンマ区切り(Web Client ID)
wrangler secret put GOOGLE_CLIENT_SECRET                    # Web Client の client_secret
wrangler secret put APPLE_BUNDLE_ID                         # フェーズ 2 で
wrangler secret put DEV_BYPASS_ENABLED                      # dev 環境のみ true
```

dev / 本番で同じ secret 名を使うが、**本番では `DEV_BYPASS_ENABLED` を投入しない**。

`POST /api/auth/google`(OAuth 認可コードのトークン交換)は `GOOGLE_CLIENT_IDS` と
`GOOGLE_CLIENT_SECRET` の両方が無いと動かない。dev / 本番それぞれに投入すること。

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

## チケット 09 完了時の知見

- **JST 日付計算は `Date.now() + 9h` + UTC ISO の slice**: Workers ランタイムの `Intl.DateTimeFormat` の TZ サポートは限定的(対応していてもバンドルサイズ増)。`new Date(now + 9*3600*1000).toISOString().slice(0,10)` の方が確実かつ軽い
- **`nextJstMidnightIso` は `YYYY-MM-DDT00:00:00Z` を parse → setUTCDate +1**: 直接 `new Date(jstStr + '+09:00')` を作るとパース挙動がエンジン依存。一度 UTC midnight に揃えてから日付演算する方が安全
- **`UsageRecord` は壊れていたら count=0 扱い**: `JSON.parse` 失敗・型不正でもクラッシュさせない。MVP の堅牢性優先で、悪意ある書き込みより自然破損(古いスキーマ等)への対応
- **`incrementUsage` の TTL は毎回更新**: `put` のたびに `expirationTtl: 60*60*48` を渡すので、同日中の連続アクセスで TTL が伸びる。問題ない理由 = キー名に日付が含まれるため、翌日 00:00 以降は別キーが使われ、古いキーは TTL 終了で自動削除される
- **KV は eventual consistency**: 同時タップで競合した場合、両方が count=2 を読んで count=3 を書く可能性あり。**3 回制限の目的なら誤差 1 回は許容**(REQUIREMENTS の技術メモに従う)。厳密な ACID が必要になったら Durable Objects に切り替え
- **ローカル KV state の場所**: `workers/.wrangler/state/v3/kv/` 配下。テスト時のリセットは `rm -rf .wrangler/state`。コミットしない(`.gitignore` で除外済み)
- **429 は `RATE_LIMIT_EXCEEDED` 専用ステータス**: クライアント `lib/api.ts` の **401 自動ログアウトと混同しない**こと。クライアント側で 429 を受けたら「今日はもう3回占いました」表示で signOut させない(404・500 も同様)
- **`incrementUsage` の位置は処理成功後**: 10 で Gemini 呼び出しが入ったら、Gemini 失敗時に increment しないよう try/catch で囲う。**失敗時にカウンターを増やさない**ことでユーザーを保護
- **`resetAt` は固定タイムゾーンオフセット `+09:00`**: JST はサマータイム無しなので 1 年中 +09:00。`Asia/Tokyo` の長い名前は使わない(ISO 8601 標準は数値オフセットのみ)
- **`usage: { today, max }` を返すかどうかで構造が決まる**: 11 のホーム画面で「今日の残り: max-today」を表示する前提なので、200 レスポンスには必ず付ける。429 では既に上限なので不要(`resetAt` だけあれば足りる)

## チケット 10 完了時の知見

- **Gemini エンドポイント**: `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={API_KEY}`。POST、JSON body、`Content-Type: application/json`。モデル名は `MODEL` 定数(`workers/src/gemini.ts`)で集約管理
- **`responseSchema` 強制で JSON は確実**: ただしフィールド漏れは `required` 配列で制御。`required` 漏れがあると `score` のように optional 扱いになり、`undefined` で返る可能性
- **リトライは 4xx で即時失敗**: 認証ミス・content policy 違反・bad request はリトライしても直らない。429 と 5xx のみ対象。`shouldRetry(status)` で判定
- **`AbortController` の `clearTimeout` は `finally`**: 早期 return / 例外で抜けても timer が残らないよう、必ず `try { ... } finally { clearTimeout(timer) }`
- **失敗時 `incrementUsage` に到達しない構造**: `try { result = await callGemini(...) } catch { return ... }`。catch 側で必ず return することで「失敗時は KV カウンタを増やさない」を保証(09 の構造的位置確保が活きる)
- **エラー詳細はクライアントに渡さない**: 502 のメッセージは固定文(`'Failed to generate result. Please try again.'`)。Gemini レスポンスにユーザー画像のメタや内部情報が混ざるリスクを遮断。500 misconfig は内部不備なので `e.message` をそのまま出してデバッグしやすく
- **base64 をログに出さない**: `console.log` の引数に `imageBase64` を絶対に入れない。エラー詳細の `e.message` も 200 文字に切ってから出す(`text.slice(0, 200)`)
- **プロンプトの分離**: `prompts.ts` で `Mode → string` のマップにしておくと 19 で差し替えるときに API 層(`gemini.ts`)を触らなくて済む。`gemini.ts` は `PROMPTS[mode]` を読むだけ
- **`as const` で RESULT_SCHEMA を凍結**: `responseSchema` に渡すオブジェクトは `as const` でリテラル型固定にしておくと TypeScript の型推論が効きやすい
- **モデル名は `gemini-3-flash-preview`(REQUIREMENTS §2.3)**: 1 行定数 `MODEL` で固定。バージョン上げ時はここだけ変更
- **Cloudflare Workers の `setTimeout` は wall-clock 計測**: CPU 時間制限(50ms 〜 30s)とは別物。fetch 待ち中は CPU を使わないので 30 秒タイムアウトを安全に張れる

## チケット 19 完了時の知見

- **プロンプトは「キャラ宣言 → トーン → 出力フィールドの考え方 → ガード」の 4 ブロック構成で揃える**: charm/palm/match を同じ並びにしておくと、A/B テスト時に差分が「キャラ名」「フィールドの説明文」だけに収束する。Web 版から移植する場合も同じテンプレートに当てはめると比較・調整が容易
- **動物ガードは `ANIMAL_GUARD` 共通定数で 1 箇所定義**: 3 プロンプトの末尾に文字列 concat する形で埋め込み。「絶滅危惧種・不気味な生物・否定的イメージ」の NG 追加は 1 箇所更新で 3 モード全反映。**シニア向けアプリの安全弁**として最初から仕込む
- **`uranai-kikkake-spec.md`(Web 版仕様書)はリポジトリ外**: ticket は「Web 版から移植」と書いてあるが、現状リポジトリにはない。REQUIREMENTS §6.2.x のヒント(キャラ・トーン・必須フィールド)を元に charm 充実度で書き起こすのが現実解。後日 Web 版仕様が手に入ったらマージする方針
- **match の `score` 必須化はプロンプトの自然言語制約**: `RESULT_SCHEMA.required` に `score` を入れない理由 = charm/palm では出さないため。match だけ動的 schema にすると保守が増える。プロンプトで「**必ず**」「**60 未満は絶対に出さない**」と強調することで実用上問題なし
- **palm に「線が読めなくても架空で構わない」を明示**: 「画像が不鮮明で読めません」のような断りを Gemini が返すリスクを潰すため、自由度を文面で明示的に許可する。占い系プロンプトでは「分かりません応答」が UX の最大の敵
- **否定的内容の禁止は palm/match にも個別 NG 列挙**: charm の「DNA 継承」だけだと弱い。「悪い手相が出ている」「破局確実」「相性が悪い」など、ありがちな否定表現を **具体的に列挙して禁止**する方が効く
- **絵文字の位置・選定もプロンプトで導く**: `animal: "🦊 好奇心旺盛なキツネ"` のような「絵文字 + 動物名 + 補足」形式を期待しているため、ANIMAL_GUARD に「動物本体の絵文字を必ず付ける」と書く。`animal` フィールドが文字だけになる事故を防ぐ
- **REQUIREMENTS の出所(§6.2.x)はコメントで残す**: 各プロンプト定数の上に `// REQUIREMENTS §6.2.x` を 1 行コメント。将来 REQUIREMENTS が更新された時、どのプロンプトがどの仕様に紐づくか追跡できる
- **プロンプトは静的検証では拾えない**: tsc で構文/import は守れるが、文面の品質(トーン・否定回避・JSON 遵守)は **実画像 × 実 Gemini** でしか分からない。受入は wrangler dev + 実機で 5 サンプル × 3 モードを目視確認

## チケット 25 完了時の知見

- **`GOOGLE_CLIENT_IDS` には Web Client ID を入れる**(id_token の `aud` は Web Client ID になる、Android/iOS Client ID ではない)。投入: `wrangler secret put GOOGLE_CLIENT_IDS --env production`、値は `XXX.apps.googleusercontent.com` 形式
- **複数 Client ID をカンマ区切りで指定可能**: 入力で `id1,id2,id3` 形式、`audience: env.GOOGLE_CLIENT_IDS.split(',')` で配列扱い。iOS / Android で個別 Client ID を取った場合に追記
- **本番では `DEV_BYPASS_ENABLED` を未設定**: stub を完全に拒否するため、`wrangler.toml` の `[env.production]` には書かない(現状の設定通り、追加不要)
- **dev Workers では `DEV_BYPASS_ENABLED=true`**: Expo Go + stub フロー専用に維持。本番 Workers と完全分離(`wrangler.toml` の env.production を別エントリで管理)
- **`verifyGoogle` の audience 検証**: Workers は `jose.jwtVerify` で `aud` を自動検証。Client ID 一覧と一致しない id_token は弾く。クライアントが間違った Client ID を使うと 401 に
- **クライアント側の id_token decode は audience 検証なし**: クライアントは sub を取り出すだけで、audience の正当性は Workers が責任を持つ(信頼境界の置き場所)

### トークン交換エンドポイント `POST /api/auth/google`(実機デバッグで追加)

- **なぜ Workers でトークン交換するのか**: 「ウェブアプリケーション」型 OAuth クライアントは confidential client で、Google がトークン交換に `client_secret` を**必須**にする(アプリ側で直接交換すると `invalid_request` / `client_secret is missing`)。`client_secret` は機密なのでアプリに持たせず、アプリは `code`/`codeVerifier`/`clientId` を Workers に送り、Workers が `GOOGLE_CLIENT_SECRET` を足して Google と交換、`idToken` を返す
- **`GOOGLE_CLIENT_SECRET` を secret 投入**: `wrangler secret put GOOGLE_CLIENT_SECRET`(dev は `--env=""`、本番は `--env production`)。値は Google Cloud Console の Web クライアントの「クライアント シークレット」(`GOCSPX-...`)。未投入だと `/api/auth/google` が 500
- **トークン交換の `redirect_uri` は認可リクエスト時と完全一致が必須**: Google が照合する。`workers/src/index.ts` の `GOOGLE_REDIRECT_URI` 定数とアプリの `lib/auth/google.ts:REDIRECT_URI` を必ず揃える
- **`clientId` は許可リスト検証してから交換**: リクエストの `clientId` が `GOOGLE_CLIENT_IDS` に含まれるか確認。任意の client_id を弾く
- **認可コードは 1 回限り**: 同じ code で 2 回交換すると Google が `invalid_grant`。クライアント側の二重実行ガード(app/CLAUDE.md「callback 二重マウント」)と合わせて交換を 1 回に抑える
- **curl でビルド前検証できる**: 偽の `code` + 正しい `clientId` で叩いて `401 Token exchange failed` が返れば「エンドポイント到達・clientId 検証・`GOOGLE_CLIENT_SECRET` 設定」まで OK(`500 not configured` なら secret 未投入)。EAS ビルドを消費せず確認できる
