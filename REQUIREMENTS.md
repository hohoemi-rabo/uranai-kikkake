# 占い キッカケ Mobile - 要件定義書

> Web版「占いキッカケ」のExpoモバイルアプリ版。顔相を「魅力発見モード」に進化させ、手相・相性は占いキッカケのユーモアを継承。シニア層を中心にiOS / Android両ストアで公開する。

---

## 0. ドキュメントの位置づけ

本書は **Claude Code(vibe coding)** での実装を前提とした要件定義書です。実装担当のClaude Codeが本書を参照しながら段階的にコーディングを進められるよう、機能仕様・UI仕様・API仕様・データ構造を一貫して記述しています。

参考資料:
- `uranai-kikkake-spec.md`(Web版「占いキッカケ」の仕様書) — 既存資産として参照する
- 既存ほほ笑みラボアプリ「パスもん」 — Expo + NativeWind + Supabase 構成の前例

---

## 1. プロジェクト概要

### 1.1 アプリ名

**占いキッカケ**(うらない きっかけ)

- ストア表示名: **占いキッカケ**
- サブタイトル: **会話がもっと楽しくなる**(Web版から継承)
- Web版「占いキッカケ」(Gemini Canvas提出版)のブランドを継承するモバイル版という位置づけ
- バンドルID / パッケージ名は別途決定(候補: `jp.hohoemirabo.uranaikikkake`)

### 1.2 コンセプト

会話のきっかけを作り、自分や相手の「魅力」を発見する、世代を超えて楽しめるエンターテイメントアプリ。

- AIがユーモアを込めて画像から人を診断
- 占いの結果は「当たる/外れる」ではなく「会話のきっかけ」が目的
- 「魅力発見モード」では占いの枠を超えて、自分や相手の良いところに気づく体験を提供
- シニア層・家族の集まり・初対面のアイスブレイクで活用

### 1.3 ターゲットユーザー

- **メイン**: シニア層(60代以上)+ その家族
- **サブ**: 友人・恋人・初対面の人とのアイスブレイクをしたい全年代
- ほほ笑みラボの生徒さん(約20名)を初期ユーザーとして想定

### 1.4 既存Web版「占いキッカケ」との関係

| 項目 | Web版 | モバイル版(本プロジェクト) |
|------|-------|----------------------------|
| 提出先 | Gemini Canvas大会 | iOS App Store / Google Play |
| 認証 | なし(Canvas環境) | Google + Apple ID 必須 |
| API保護 | Canvas環境が自動注入 | Cloudflare Workers経由で保護 |
| 回数制限 | なし | 1日3回(サーバ管理) |
| 顔相 | 占いとして診断 | 「魅力発見モード」として進化 |
| 手相・相性 | 占い | 占い(Web版継承) |
| 結果画像 | ダウンロード | カメラロール保存 |
| 音声読み上げ | なし | 日本語音声で読み上げ |

### 1.5 ビジネスモデル(フェーズ1)

- **完全無料**(課金・広告なし)
- 1日3回の利用制限でAPIコストを制御
- フェーズ2以降で課金/広告/プレミアム機能を検討

---

## 2. 技術スタック

### 2.1 フロントエンド(Expo)

| カテゴリ | 採用技術 | 補足 |
|---------|---------|------|
| フレームワーク | **Expo SDK 54+** | EAS Build前提 |
| 言語 | **TypeScript** | strict mode |
| スタイリング | **NativeWind v4** | Tailwind文法でWeb版資産を転用 |
| ナビゲーション | **expo-router v4** | ファイルベースルーティング |
| 状態管理 | React Hooks(useState/useReducer/Context) | Zustand等の追加ライブラリは原則不要 |
| カメラ | `expo-camera` | 前面/背面切り替え対応 |
| 画像加工 | `expo-image-manipulator` | リサイズ・JPG変換(HEIC自動処理) |
| 写真選択 | `expo-image-picker` | フォトライブラリから選択 |
| 結果画像生成 | `react-native-view-shot` | html2canvas相当 |
| カメラロール保存 | `expo-media-library` | 写真アプリへの保存 |
| 音声読み上げ | `expo-speech` | 日本語TTS |
| 認証(Google) | `expo-auth-session` + `expo-crypto` | OAuth 2.0 / OIDC |
| 認証(Apple) | `expo-apple-authentication` | iOS Sign in with Apple |
| トークン保管 | `expo-secure-store` | IDトークン・リフレッシュトークン |
| ローカル設定 | `@react-native-async-storage/async-storage` | フラグ・初回起動判定など |
| フォント | `expo-font` + Google Fonts | M PLUS Rounded 1c |

### 2.2 バックエンド(Cloudflare Workers)

| カテゴリ | 採用技術 | 役割 |
|---------|---------|------|
| ランタイム | **Cloudflare Workers** | エッジ実行 |
| 言語 | TypeScript | wrangler でデプロイ |
| KVストア | **Cloudflare KV** | ユーザーごとの利用回数カウンター |
| ID検証(Google) | Google公開鍵で `id_token` を検証 | jose ライブラリ |
| ID検証(Apple) | Apple公開鍵で `identityToken` を検証 | jose ライブラリ |
| AI呼び出し | Gemini API直叩き | APIキーはWorker環境変数 |

### 2.3 AI

- **Google Gemini API**
  - モデル: `gemini-3-flash-preview`(Web版と統一)
  - 構造化出力(`responseSchema`)使用
  - APIキーは **絶対にクライアントに置かない**(Workers経由で呼び出し)

### 2.4 開発・運用

- パッケージマネージャ: `pnpm` または `npm`(プロジェクト統一)
- Lint/Format: ESLint + Prettier
- ビルド: **EAS Build**(`eas build --platform all`)
- アップデート配信: **EAS Update**(必要に応じて)
- バージョン管理: Git + GitHub
- CI: 必要に応じて GitHub Actions(EAS Buildトリガ)

---

## 3. システム構成

### 3.1 全体構成図

```
┌──────────────────┐         ┌─────────────────────────┐         ┌──────────────────┐
│  Expoアプリ       │         │ Cloudflare Workers      │         │ Gemini API       │
│  (iOS / Android)  │ ──────> │ /api/divine             │ ──────> │ generateContent  │
│                   │         │ ・IDトークン検証          │         │                  │
│                   │ <────── │ ・利用回数チェック         │ <────── │                  │
│                   │         │ ・KVカウンター更新         │         │                  │
└──────────────────┘         │ ・Gemini呼び出し           │         └──────────────────┘
        │                    └─────────────────────────┘
        │                              │
        │ Google / Apple OAuth         │ Cloudflare KV
        │                              ▼
        ▼                    ┌─────────────────────────┐
┌──────────────────┐         │ KEY: usage:{provider}:  │
│ Google / Apple    │         │      {sub}:{date}      │
│ ID Provider       │         │ VALUE: { count: 2 }    │
└──────────────────┘         └─────────────────────────┘
```

### 3.2 データの流れ

1. ユーザーがアプリで Google または Apple でサインイン
2. クライアントは `id_token` を取得し、`expo-secure-store` に保存
3. ユーザーが診断を実行 → 画像をリサイズ → Workers にPOST(Bearer: id_token)
4. Workers が IDトークン検証 → KV カウンター確認 → 上限内なら Gemini 呼び出し → カウンター +1 → 結果を返す
5. 上限到達時はエラーレスポンスを返し、クライアントで「また明日会いましょう!」表示

---

## 4. 機能仕様

### 4.1 認証フロー

#### 4.1.1 初回起動

1. **オンボーディング画面**(3〜4ステップのスライド)
   - このアプリでできること(魅力発見・占い)
   - エンタメであること
   - スマホでの利用がおすすめ
2. **ログイン画面**
   - 「Googleでログイン」ボタン
   - 「Appleでログイン」ボタン(iOSのみ表示)
   - プライバシーポリシー / 利用規約へのリンク

#### 4.1.2 ログイン処理

| プロバイダ | 使用ライブラリ | 取得するもの |
|----------|-------------|--------------|
| Google | `expo-auth-session/providers/google` | `id_token` |
| Apple | `expo-apple-authentication` | `identityToken` |

- 取得したトークンは `expo-secure-store` に保存
- API呼び出し時は `Authorization: Bearer {idToken}` ヘッダで送信
- IDトークン期限切れ時は再ログインを促す(**フェーズ1ではリフレッシュトークン処理を簡略化**)

#### 4.1.3 ログアウト

- 設定画面から実施
- `expo-secure-store` をクリア + ログイン画面へ

### 4.2 回数制限

#### 4.2.1 仕様

| 項目 | 内容 |
|------|------|
| 上限 | **1日3回**(全モード合算) |
| カウント単位 | 認証済みユーザー(`provider:sub` 単位) |
| リセットタイミング | **日本時間 00:00**(JST = UTC+9) |
| 管理場所 | Cloudflare KV |
| キー設計 | `usage:{provider}:{sub}:{YYYY-MM-DD}` |
| TTL | 48時間(日跨ぎ後に自動削除) |
| 制限到達時 | 「今日はもう3回占いました。また明日会いましょう!」 |

#### 4.2.2 KV エントリ例

```typescript
// キー例: usage:google:1234567890:2026-05-09
// バリュー例:
{
  count: 2,
  lastUsedAt: "2026-05-09T13:24:11+09:00"
}
```

#### 4.2.3 残り回数の表示

- ホーム画面の右上に「今日の残り: ◯回」を常時表示
- 残り0回時は撮影ボタンを無効化(グレーアウト)

### 4.3 撮影・写真選択フロー

Web版の仕様を踏襲しつつ、ネイティブの利点を活かす:

1. ホーム画面でタブ選択(魅力発見 / 手相 / 相性)
2. 「📷 カメラ」または「📁 写真から選ぶ」をタップ
3. **カメラの場合**: `expo-camera` を起動 → モード別フレームを表示 → 撮影
4. **写真選択の場合**: `expo-image-picker` でフォトライブラリから選択
5. プレビュー画面で確認 → 「占ってみる」または「魅力を発見する」をタップ
6. 診断中スピナー表示 → Workers にPOST → 結果画面へ遷移

#### 4.3.1 モード別フレーム

| モード | フレーム |
|-------|--------|
| 魅力発見(顔) | 中央に1枠「ここに顔を合わせてね」 |
| 手相 | 縦長1枠「手のひらを映してね」 |
| 相性 | 横並び2枠「1人目」「2人目」(または手相を並べる) |

#### 4.3.2 画像処理(送信前)

- `expo-image-manipulator` で **最大1024px** にリサイズ
- 品質 0.8 のJPEG出力 → Base64エンコード
- Web版の `resizeImageForAPI()` と同等の挙動
- iOS HEIC は `expo-image-manipulator` が自動的にJPGに変換するため、専用ライブラリ不要

### 4.4 診断実行(API呼び出し)

#### 4.4.1 クライアント → Workers リクエスト

```typescript
POST https://uranai-kikkake-api.{workers-subdomain}.workers.dev/api/divine
Authorization: Bearer {idToken}
Content-Type: application/json

{
  "provider": "google" | "apple",
  "mode": "charm" | "palm" | "match",  // 魅力発見 / 手相 / 相性
  "imageBase64": "/9j/4AAQSkZJRgABAQEA..." // JPEGのbase64(プレフィックスなし)
}
```

#### 4.4.2 Workers のレスポンス

**成功時(200)**:
```json
{
  "result": {
    "title": "...",
    "animal": "🦊 好奇心旺盛なキツネ",
    "personality": "...",
    "luckyItem": "...",
    "advice": "...",
    "score": 88,
    "icebreaker": "..."
  },
  "usage": { "today": 2, "max": 3 }
}
```

**回数上限エラー(429)**:
```json
{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "今日はもう3回占いました。また明日会いましょう!",
  "resetAt": "2026-05-10T00:00:00+09:00"
}
```

**認証エラー(401)** / **その他のエラー(500等)** も適切に返す。

#### 4.4.3 Workers の処理フロー

```typescript
// 疑似コード
1. Authorization ヘッダから idToken を取り出す
2. provider に応じて Google / Apple の公開鍵で検証
3. sub(subject)を取得
4. 今日の日付(JST)を計算
5. KV から usage:{provider}:{sub}:{date} を取得
6. count >= 3 なら 429 を返す
7. Gemini API を呼び出し(リトライ最大5回、エクスポネンシャルバックオフ)
8. KV のカウンタを +1 する(TTL 48時間)
9. 結果を返す
```

### 4.5 結果画面

Web版を踏襲しつつ、ネイティブで以下を追加:

| 機能 | 仕様 |
|------|------|
| 段階的アニメーション | Web版同等(スコア → 動物 → メッセージ → アイテム/アドバイス → 話題) |
| タイプライター | メッセージ部分。`useEffect` で1文字ずつ追加(35ms間隔) |
| **音声読み上げ** | 「🔊 読み上げる」ボタン → `expo-speech` で日本語音声(タイトル → メッセージ → 話題の順) |
| **カメラロール保存** | 「💾 画像を保存」ボタン → `react-native-view-shot` で結果カードをキャプチャ → `expo-media-library` で保存 |
| 「最初に戻る」ボタン | ホーム画面に戻る |
| エンタメ注釈 | Web版同様、画面下部に小さく表示 |

#### 4.5.1 音声読み上げの仕様

- ボタンタップで開始/停止トグル
- 読み上げ順序: 動物 → 占いメッセージ → おすすめの話題
- 読み上げ中はボタンが「⏸ 停止」に変化
- 言語: `ja-JP`、レート: 1.0(標準)、ピッチ: 1.0
- 画面遷移時は自動停止

#### 4.5.2 結果画像保存の仕様

- 画像サイズ: 1080 × 自動高さ(4:5比率目安)
- レイアウト: ヘッダー(アプリ名+モード)/ 写真 / タイトル / 動物 / スコア(相性のみ)/ メッセージ / アイテム&アドバイス / おすすめの話題 / フッター(日付+アプリ名)
- 保存先: 端末のフォトライブラリ(カメラロール)
- 保存時に「写真への保存」権限がなければリクエスト
- 保存成功時: 「写真アプリに保存しました!」のトースト表示

### 4.6 「魅力発見モード」の体験設計

| 項目 | 仕様 |
|------|------|
| アクセス方法 | ホーム画面の最初のタブ(デフォルト選択) |
| 撮影対象 | 顔写真(自分・家族・友達・ペットなど何でも) |
| トーン | **ユーモア維持 + ポジティブ寄り**(占いキッカケのDNAを残す) |
| キャッチコピー | 「あなたの魅力、見つけてみよう」 |
| 結果のテーマ | 否定的な要素は出さない、長所と魅力にフォーカス |

(プロンプトの詳細は §6 参照)

---

## 5. UI/UX 仕様

### 5.1 デザインテーマ:タブごとに色を変える

| タブ | アイコン | テーマカラー | 用途 |
|------|---------|-------------|------|
| 🌟 魅力発見 | キラキラ | **コーラルピンク**(rose-400 #FB7185) | 新色・温かみあり |
| ✋ 手相 | 手 | ティール(teal-400 #2DD4BF) | Web版継承 |
| 💖 相性 | ハート | オレンジ(orange-400 #FB923C) | Web版継承 |

#### 5.1.1 ベース配色

| 要素 | カラー | 用途 |
|------|--------|------|
| ベース背景 | sky-50 (#F0F9FF) | アプリ全体 |
| カード背景 | white / slate-50 | コンテンツカード |
| 開運アイテム | amber-50 (#FFFBEB) | アイテムカード |
| アドバイス | emerald-50 (#ECFDF5) | アドバイスカード |
| メインテキスト | slate-900 / slate-800 | 本文 |
| サブテキスト | slate-500 / slate-600 | 補足 |

#### 5.1.2 連動する要素

タブ選択時、以下の要素のアクセントカラーが連動:
- 撮影フレームの枠線
- カメラ起動ボタンのボーダー
- 「占ってみる」「魅力を発見する」ボタンの背景
- 結果画面の見出し色・カード左ボーダー
- ホーム画面のヒントテキストの点滅色

### 5.2 フォント

- **M PLUS Rounded 1c**(Google Fonts、`expo-font`で読み込み)
- ウェイト: 400 / 700 / 900
- 丸みのあるやさしい日本語フォントで可読性を確保

### 5.3 シニア配慮

- **大きなボタン**(最低 `p-5`、`text-lg` 以上)
- **明るくコントラストの高い色**(ダークモードは採用しない)
- **平易な日本語**:「カメラを切り替える」「ここに顔を合わせてね」など
- **絵文字+文字**で視覚的に伝える
- **通知なし**(押し付けがましさを排除、ほほ笑みラボの一貫した方針)
- **音声読み上げ**で「読まなくていい」体験を提供

### 5.4 アニメーション

- フェードイン・スライドアップは `react-native-reanimated`(Expo標準同梱)
- タイプライター効果は `setInterval` ベースのシンプル実装
- 診断中オーバーレイは控えめなスピナー(Web版踏襲)

### 5.5 画面構成

```
[ログイン画面] (未認証時のみ)
   ↓
[オンボーディング(初回のみ)]
   ↓
[ホーム画面] ─────────┐
   ├─ タブ切替(魅力発見/手相/相性)
   ├─ 残り回数表示
   ├─ カメラ / 写真選択 ボタン
   └─ 設定アイコン → [設定画面]
   ↓
[カメラ画面] or [写真選択]
   ↓
[プレビュー画面]
   ↓
[診断中オーバーレイ]
   ↓
[結果画面]
   ↓
[ホーム画面] ←───────┘
```

#### 5.5.1 設定画面

- アプリ情報・バージョン
- 利用規約 / プライバシーポリシー(WebView表示)
- ログアウト
- お問い合わせ(メールリンク)
- 「はじめての方へ」を再表示
- フェーズ1.1以降: 履歴表示・お気に入り

---

## 6. プロンプト設計

### 6.1 共通レスポンススキーマ

```typescript
const RESULT_SCHEMA = {
  type: "OBJECT",
  properties: {
    title:        { type: "STRING" },  // キャッチーな診断名
    animal:       { type: "STRING" },  // 動物例え(絵文字込み)
    personality:  { type: "STRING" },  // 詳細診断(200字程度)
    luckyItem:    { type: "STRING" },  // 開運アイテム(魅力発見では「魅力を引き立てるアイテム」)
    advice:       { type: "STRING" },  // 一言アドバイス
    score:        { type: "NUMBER" },  // 相性スコア(matchのみ、0-100)
    icebreaker:   { type: "STRING" }   // おすすめの第一声
  },
  required: ["title", "animal", "personality", "luckyItem", "advice", "icebreaker"]
};
```

### 6.2 モード別プロンプト

#### 6.2.1 魅力発見モード(charm)

```
あなたは「AI魅力発見士」です。写真の人物(またはペット・人形)から、
ユーモアを少し交えながらも、その人の素敵な魅力・長所・チャームポイントを
ポジティブに発見してください。

【トーン】
- ユーモアは残しつつ、占いキッカケのDNAを継承
- 否定的・辛口な内容は絶対に避ける
- 「~らしさ」「~なところが素敵」「~な雰囲気を持っている」など、
  読んだ人が嬉しくなるポジティブな表現を心がける
- シニアの方が読んでクスッと笑い、家族に話したくなるトーン

【出力フィールドの考え方】
- title: 「銀河系一の◯◯」のようなキャッチーで褒め称えるタイトル
- animal: 似ている動物 + 絵文字 + その動物の魅力
- personality: 200字程度で、その人の魅力を詩的かつユーモラスに描写
- luckyItem: その魅力を引き立てるアイテム(例:「明るい色のスカーフ」)
- advice: 魅力を活かすための一言アドバイス
- icebreaker: 相手にこの結果を見せた時に、最高の第一声となる一文

応答はJSON形式で、上記スキーマに厳密に従ってください。
```

#### 6.2.2 手相モード(palm)

Web版「占いキッカケ」のpalmプロンプトを踏襲。
- 「AI手相家」として手のひらの線(架空でもOK)から診断
- ユーモアを最優先

#### 6.2.3 相性モード(match)

Web版「占いキッカケ」のmatchプロンプトを踏襲。
- 「AI縁結び師」として相性をユーモラスに診断
- score(0-100)を含める

> ※ 各プロンプトの完全な文面は実装時に Web版から移植 + 微調整。

### 6.3 Gemini API ペイロード

```typescript
const payload = {
  contents: [{
    role: "user",
    parts: [
      { text: PROMPTS[mode] },
      { inlineData: { mimeType: "image/jpeg", data: imageBase64 } }
    ]
  }],
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: RESULT_SCHEMA
  }
};
```

---

## 7. 認証・権限

### 7.1 認証プロバイダ

| プラットフォーム | Google | Apple |
|----------------|--------|-------|
| iOS | ✅ 提供 | ✅ **提供必須**(App Store Guideline 4.8) |
| Android | ✅ 提供 | ❌ 不要 |

#### 7.1.1 Google ログイン

- ライブラリ: `expo-auth-session/providers/google`
- 必要設定:
  - Google Cloud Console で iOS / Android / Web クライアントID取得
  - `app.json` の `scheme` 設定
  - iOS: `URL Scheme` 登録(`com.googleusercontent.apps.{ID}`)
  - Android: SHA-1 フィンガープリント登録(EAS Buildのキーストアに対応)

#### 7.1.2 Apple ログイン

- ライブラリ: `expo-apple-authentication`
- 必要設定:
  - Apple Developer で App ID に「Sign In with Apple」capability追加
  - `app.json` で `usesAppleSignIn: true`
- iOSシミュレータでは動作しないため、実機テスト必須

#### 7.1.3 IDトークン検証(Workers側)

- Google: `https://www.googleapis.com/oauth2/v3/certs` から公開鍵取得
- Apple: `https://appleid.apple.com/auth/keys` から公開鍵取得
- `jose` ライブラリで JWT を検証(`iss`、`aud`、`exp` のチェック)
- 検証成功で `sub` を取り出してKVキーに使用

### 7.2 端末権限

| 権限 | iOS Purpose String | Android Permission |
|------|-------------------|-------------------|
| カメラ | `NSCameraUsageDescription`「人相・手相を診断するためにカメラを使用します」 | `android.permission.CAMERA` |
| 写真ライブラリ(読込) | `NSPhotoLibraryUsageDescription`「お持ちの写真から診断するために使用します」 | `READ_MEDIA_IMAGES` |
| 写真ライブラリ(保存) | `NSPhotoLibraryAddUsageDescription`「診断結果の画像を保存します」 | `WRITE_EXTERNAL_STORAGE`(Android 9以下) |

### 7.3 プライバシー扱い

- **顔写真は端末内 → Workers経由 → Gemini送信のみ**
- **Workers側でも保存しない**(KVには保存しない、ログにも残さない)
- **Geminiの応答後、画像データは即座に破棄**
- ストアの「データの安全性」「アプリのプライバシー」欄で明示

---

## 8. ストア対応

### 8.1 iOS App Store

#### 8.1.1 審査での重点ポイント

- **占い表現**: 「エンターテイメント」を明確に表示(アプリ内・スクショ・説明文)
  - 「魅力発見モード」を前面に押し出して占い色を薄める
- **Sign in with Apple**: Googleログインを提供する以上、必須実装(Guideline 4.8)
- **顔画像の扱い**: プライバシーポリシーで「撮影画像をAIで処理し、保存しない」を明記
- **カメラ・写真権限**: Purpose Stringを丁寧に記述

#### 8.1.2 提出物

- アイコン(1024×1024)
- スクリーンショット(各サイズ)
- アプリ説明文(タイトル・サブタイトル・説明)
- プライバシーポリシーURL
- 利用規約URL(任意だが推奨)
- App Privacy(データ収集の宣言)
- カテゴリ:**エンターテイメント**

### 8.2 Google Play

#### 8.2.1 審査での重点ポイント

- **占いカテゴリの明示**: 不適切な表現に該当しないよう、ポジティブで健全な内容を維持
- **データセーフティ**: 顔画像の取扱を正直に申告
- **ターゲット年齢**:全年齢(シニア層を主とするが、子供でも安全)

#### 8.2.2 提出物

- アイコン(512×512)
- 機能グラフィック(1024×500)
- スクリーンショット
- 短い説明文(80文字以内)
- 詳細な説明文
- プライバシーポリシーURL
- データセーフティフォーム

### 8.3 プライバシーポリシー(別途作成)

最低限含めるべき項目:
- 取得する情報(認証ID・利用回数・撮影画像)
- 利用目的
- 第三者提供(Gemini API へのデータ送信)
- 保存期間(認証ID・利用回数のみ48時間KVに保管、画像は保存しない)
- ユーザーの権利(アカウント削除依頼の連絡先)

### 8.4 利用規約(別途作成)

最低限含めるべき項目:
- 本アプリはエンタメであり、占い結果は当たることを保証しない
- 1日の利用回数制限
- ユーザーの責任(他人の写真を本人の同意なく撮影しないなど)
- 免責事項

---

## 9. ファイル構成案(Expo Router)

```
uranai-kikkake-mobile/
├── app/                         # expo-router
│   ├── _layout.tsx              # ルートレイアウト(認証ガード)
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx            # ログイン画面
│   │   └── onboarding.tsx       # オンボーディング(初回のみ)
│   ├── (main)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx            # ホーム画面(タブ切替・カメラ起動)
│   │   ├── camera.tsx           # カメラ画面
│   │   ├── preview.tsx          # プレビュー画面
│   │   ├── result.tsx           # 結果画面
│   │   └── settings.tsx         # 設定画面
│   └── +not-found.tsx
├── src/
│   ├── components/
│   │   ├── TabSwitcher.tsx
│   │   ├── CameraView.tsx
│   │   ├── ResultCard.tsx       # 結果画像生成用
│   │   ├── TypewriterText.tsx
│   │   ├── AnalyzingOverlay.tsx
│   │   ├── UsageBadge.tsx       # 残り回数表示
│   │   └── ui/                  # ボタン・カードなど共通UI
│   ├── hooks/
│   │   ├── useAuth.ts           # ログイン状態・トークン管理
│   │   ├── useCamera.ts
│   │   ├── useDivine.ts         # API呼び出し
│   │   ├── useSpeech.ts         # 音声読み上げ
│   │   └── useSaveImage.ts      # カメラロール保存
│   ├── lib/
│   │   ├── api.ts               # Workers APIクライアント
│   │   ├── auth/
│   │   │   ├── google.ts
│   │   │   └── apple.ts
│   │   ├── image.ts             # リサイズ・base64変換
│   │   ├── prompts.ts           # 各モードのプロンプト
│   │   └── theme.ts             # タブカラー定義
│   ├── types/
│   │   └── index.ts             # 共通型定義
│   └── constants/
│       └── config.ts
├── assets/
│   ├── fonts/                   # M PLUS Rounded 1c
│   └── images/                  # アイコン・スプラッシュ
├── workers/                     # Cloudflare Workers(別リポジトリにしてもOK)
│   ├── src/
│   │   ├── index.ts             # ルーティング
│   │   ├── divine.ts            # /api/divine ハンドラ
│   │   ├── auth.ts              # IDトークン検証
│   │   ├── kv.ts                # KV操作
│   │   └── gemini.ts            # Gemini呼び出し
│   ├── wrangler.toml
│   └── package.json
├── app.json
├── eas.json
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## 10. 環境変数

### 10.1 クライアント(`.env` / `app.json` の `extra`)

```bash
EXPO_PUBLIC_API_BASE_URL=https://uranai-kikkake-api.{subdomain}.workers.dev
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=...
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=...
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=...
```

### 10.2 Workers(`wrangler secret put`)

```bash
GEMINI_API_KEY=...
GOOGLE_CLIENT_IDS=...,...,...   # iOS/Android/Web の audience ホワイトリスト
APPLE_BUNDLE_ID=com.example.uranai-kikkake
```

KV namespace は `wrangler.toml` でバインド:
```toml
[[kv_namespaces]]
binding = "USAGE_KV"
id = "..."
```

---

## 11. 開発ロードマップ

### フェーズ1(MVP・本書のスコープ)

- [ ] プロジェクト初期化(Expo + NativeWind + TypeScript)
- [ ] Cloudflare Workers のスケルトン作成
- [ ] Google ログイン実装
- [ ] Apple ログイン実装
- [ ] Workers の IDトークン検証実装
- [ ] KV 利用回数管理実装
- [ ] Gemini 呼び出し実装(リトライ付き)
- [ ] ホーム画面(タブ切替・残り回数表示)
- [ ] カメラ画面(モード別フレーム)
- [ ] 写真選択
- [ ] プレビュー画面
- [ ] 診断中オーバーレイ
- [ ] 結果画面(Web版踏襲)
- [ ] 音声読み上げ
- [ ] 結果画像生成 + カメラロール保存
- [ ] 「魅力発見モード」プロンプト調整
- [ ] 設定画面
- [ ] オンボーディング画面
- [ ] プライバシーポリシー / 利用規約 のWebページ作成
- [ ] アプリアイコン・スプラッシュスクリーン
- [ ] EAS Build(iOS / Android)
- [ ] TestFlight / Internal Testing で実機テスト
- [ ] App Store / Play Store 提出

### フェーズ1.1(必要に応じて)

- [ ] 直近の結果履歴(AsyncStorage)
- [ ] お気に入り / ピン留め
- [ ] 共有(LINE等への直接送信)

### フェーズ2(将来構想)

- [ ] 課金 / 広告(回数追加)
- [ ] プレミアム機能(無制限・限定モード等)
- [ ] 多言語対応(英語)
- [ ] 季節ごとのテーマカラー
- [ ] 「今日の運勢」など定期診断モード

---

## 12. 設計上の注意点・Tips

### 12.1 シンプルさを最優先

- 「シェア」は **カメラロール保存に統一**(Web版でダウンロード一本にしたのと同じ思想)
- ボタン・テキストは大きく、選択肢は最小限
- シニアの「迷い」を生まないUI

### 12.2 トークン管理

- フェーズ1では **IDトークン期限切れ → 再ログイン** のシンプル方式
- リフレッシュトークン処理はフェーズ2以降で必要に応じて追加

### 12.3 端末ごとの最適化

- **iOSシミュレータ**: Apple ログイン・カメラが使えないので、実機テスト必須
- **Androidエミュレータ**: カメラはホストPCのカメラを使う設定で動作確認可能
- **HEIC**: ネイティブカメラ経由では発生しない(Expoが自動でJPG)。ただし写真選択でHEICが入ってきた場合は `expo-image-manipulator` の自動変換に任せる

### 12.4 通信の最適化

- API送信前に画像を最大1024pxにリサイズ(Web版同等)
- 品質0.8のJPEGで送信
- リクエスト失敗時のエクスポネンシャルバックオフ(Workers側)

### 12.5 倫理的配慮

- 「エンターテイメント」を **オンボーディング・結果画面・ストア説明文** の3箇所で明示
- 否定的な内容を生成しないようプロンプトを設計
- 魅力発見モードでは特に「読んだ人が嬉しくなる」を最重視

---

## 13. 参考: 既存「占いキッカケ」Web版からの移植ポイント

| Web版機能 | モバイル版での扱い |
|----------|---------------------|
| `useCamera` フック | `expo-camera` ベースに書き換え |
| `useGeminiAnalyzer` フック | `useDivine`(Workers経由)に変更 |
| `cropImageToSquare` | `expo-image-manipulator` で代替 |
| `resizeImageForAPI` | `expo-image-manipulator` で代替 |
| `html2canvas` | `react-native-view-shot` で代替 |
| HEIC変換(`heic-to`) | `expo-image-manipulator` の自動変換で不要 |
| ダウンロード処理 | `expo-media-library` でカメラロール保存 |
| タイプライター | そのまま移植可能 |
| TAB_COLORS | 魅力発見の色を新規追加してそのまま転用 |
| PROMPTS | 魅力発見プロンプトを新規追加、palm/matchはそのまま |
| RESULT_SCHEMA | そのまま |

---

## 14. 開発開始前のチェックリスト

- [x] アプリ名の最終決定 → **占いキッカケ**
- [ ] バンドルID / パッケージ名の決定(候補: `jp.hohoemirabo.uranaikikkake`)
- [ ] Apple Developer Program 加入(年額)
- [ ] Google Play Developer Console 加入(初回のみ)
- [ ] Google Cloud Console プロジェクト作成 + OAuth クライアントID発行
- [ ] Cloudflare アカウント + Workers / KV 有効化
- [ ] アプリアイコン作成(1024×1024)
- [ ] スプラッシュスクリーン作成
- [ ] プライバシーポリシー / 利用規約 ホスティング先決定(`hohoemi-rabo.com` のサブパスなど)

---

*作成日: 2026年5月9日*
*作成者: まさゆき(パソコン・スマホ ほほ笑みラボ)+ Claude(設計レビュー・要件整理)*
*ベース仕様書: `uranai-kikkake-spec.md`*
