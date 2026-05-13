# Google Cloud Console セットアップ手順(ユーザー手動)

チケット 25 のうち、コード差分は実装済み。本ドキュメントは **ユーザーが Google Cloud Console で OAuth Client ID を取得 → 関係箇所に投入する手順** をまとめたもの。

実機テストまで一気に進めるか、後日まとめてやるかはユーザー判断。

---

## A. Google Cloud Console プロジェクト作成

1. https://console.cloud.google.com/ にログイン(`rabo.hohoemi@gmail.com`)
2. 左上のプロジェクトセレクタ → **「新しいプロジェクト」**
3. 名前: `uranai-kikkake`(任意)
4. 場所: 組織なし(個人開発の場合)
5. 「作成」

---

## B. OAuth 同意画面の設定

1. 左メニュー → **「API とサービス」 → 「OAuth 同意画面」**
2. User Type: **外部**(個人開発、組織なし)
3. アプリ情報:
   - **アプリ名**: 占いキッカケ
   - **ユーザーサポートメール**: `rabo.hohoemi@gmail.com`
   - **アプリのロゴ**: (任意、`assets/store/play-store-icon-512.png` をアップロード可)
4. アプリのドメイン:
   - **アプリのホームページ**: https://hohoemi-rabo.github.io/uranai-kikkake/
   - **プライバシーポリシー**: https://hohoemi-rabo.github.io/uranai-kikkake/legal/privacy.html
   - **利用規約**: https://hohoemi-rabo.github.io/uranai-kikkake/legal/terms.html
5. デベロッパー連絡先: `rabo.hohoemi@gmail.com`
6. **保存して次へ**
7. スコープ: **`openid`** と **`profile`** のみ追加(`email` は不要)
8. テストユーザー: 自分のメールを含めて 5〜10 名(本番公開前のテスト用)
9. **保存**

> 公開ステータスを「テスト」のまま運用すれば、テストユーザーだけが使える。「本番」にすると Google の審査が入る(エンタメ用途ならスムーズ、念のため事前に確認)。

---

## C. OAuth 2.0 クライアント ID を作成

**3 つ作る必要あり**(ただし iOS Client ID はフェーズ 2 で後回し可)。

> ⚠️ **順序の注意**: Android Client ID 作成には **SHA-1 が必須**。SHA-1 は EAS Build 後にしか取れないので、**先に C-1 を作って Web Client ID を確保 → D 節で SHA-1 を取得 → C-2 / C-3 に戻る** の流れがスムーズ。

### C-1. Web アプリケーション Client ID(**必須**)

- 左メニュー → **「API とサービス」 → 「認証情報」** → **「+ 認証情報を作成」 → 「OAuth クライアント ID」**
- アプリケーションの種類: **ウェブアプリケーション**
- 名前: `uranai-kikkake-web`
- 承認済みリダイレクト URI: **空でも OK**(モバイル用なので)
- 「作成」 → **クライアント ID** をコピー(`.apps.googleusercontent.com` で終わる)

→ この ID が **`EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`** と Workers の **`GOOGLE_CLIENT_IDS`** に入る。

### C-2. Android Client ID(**必須、ただし D 節後に作る**)

> 📌 **このセクションは D 節(EAS Build → SHA-1 取得)を終えてから戻ってきてください。** SHA-1 がないと作成フォームを送信できません。

1. 左メニュー → **「認証情報」** → 「+ 認証情報を作成」 → **「OAuth クライアント ID」**
2. アプリケーションの種類: **Android**
3. 名前: `uranai-kikkake-android-prod`
4. **パッケージ名**: `jp.hohoemirabo.uranaikikkake`
5. **SHA-1 証明書フィンガープリント**: D 節で取得した production の SHA-1
6. 「作成」

**もう 1 つ作る**(dev 用):
1. 「OAuth クライアント ID」
2. 種類: Android
3. 名前: `uranai-kikkake-android-dev`
4. パッケージ名: `jp.hohoemirabo.uranaikikkake.dev`(`.dev` 付き)
5. SHA-1: D 節で取得した development profile の SHA-1
6. 「作成」

→ Android Client ID は 2 つになるが、**`EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`** には Google が「自動で正しいパッケージ名 + SHA-1 を選ぶ」ので、**1 つだけ書けば OK**(Web Client ID を入れる場合もあるが、Android 用なら Android の dev/prod どちらを書いてもよい。実装上の影響は小さい)。

> もし管理を一本化したいなら、最初の Android Client ID で **「複数のパッケージ + SHA-1」** を 1 つに登録する選択肢もある(Google Console は対応)。

### C-3. iOS Client ID(**フェーズ 2 で**)

iOS リリース時に追加。今回はスキップ。

---

## D. EAS Build で SHA-1 取得

`expo-auth-session` の Google プロバイダは Android の場合 **キーストアの SHA-1 + パッケージ名** で OAuth クライアントとマッチングする。EAS Build のキーストアは EAS クラウド側にあり、`eas credentials` で取り出せる。

### D-1. 最初のビルドを発火(キーストアを生成させる)

```bash
# development profile のビルド(初回のみ、キーストア自動生成)
eas build --profile development --platform android
```

ビルド完了まで 10〜20 分。初回はキーストアを EAS が自動生成する。

### D-2. キーストア情報を取得

```bash
eas credentials -p android
```

- プロファイル選択: **development**
- 「Keystore」 → 「Get the keystore information」 を選ぶ
- **SHA-1 Fingerprint** が表示される(`AB:CD:EF:...:12:34`)

これを `uranai-kikkake-android-dev` に登録(C-2 の 2 つ目)。

### D-3. production 用 SHA-1 も取得

同じく `eas credentials` から production プロファイルを選択。
別キーストア → 別 SHA-1 が生成される。これを `uranai-kikkake-android-prod` に登録。

> **重要**: production キーストアは **失うとアプリ更新が出せなくなる**。EAS は自動でクラウド管理するが、手元にバックアップを取っておくのも推奨。

---

## E. 取得した Client ID を投入

### E-1. `eas.json`

⚠️ **EAS の eas.json バリデータは空文字の env を許可しない**。空 placeholder は書かない/置かない方針。Client ID を **取得してから初めて** 追記する:

```json
"preview": {
  "env": {
    ...既存...,
    "EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID": "XXXXXXXXXX.apps.googleusercontent.com",
    "EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID": "YYYYYYYYYY.apps.googleusercontent.com"
  }
}
```

production セクションも同様に。**Client ID 未取得の状態で空文字を入れて先に書こうとすると `eas build` がバリデーションエラーで止まる**(`"... is not allowed to be empty"`)。

### E-2. Workers 本番に `GOOGLE_CLIENT_IDS` を投入

```bash
cd workers
echo "YYYYYYYYYY.apps.googleusercontent.com" | wrangler secret put GOOGLE_CLIENT_IDS --env production
```

- 値は **Web Client ID**(id_token の `aud` は Web になる)
- iOS Client ID を後で追加した場合は、`Web,iOS` のカンマ区切り
- Android Client ID は audience には入らない

### E-3. ローカル開発(`.env`)

`.env` は `EXPO_PUBLIC_AUTH_MODE=stub` のまま温存(Expo Go で stub フローを使い続けるため)。
Google ログインを試したい場合のみ、一時的に Google モードに切り替える:

```bash
# .env(検証時のみ)
EXPO_PUBLIC_AUTH_MODE=google
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=XXX...
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=YYY...
```

ただし Expo Go では動かない(EAS Dev Client 必須)ので、通常は `stub` のままが楽。

---

## F. dev client ビルド + 実機で動作確認

```bash
# .env を一時的に Google モードにせず、eas.json の env が効くようにビルド
eas build --profile development --platform android
```

完了後 QR コードで実機にインストール → アプリ起動 → 「🔵 Google でログイン」ボタン
→ Google アカウント選択画面 → 自分の Google アカウント選択 → アプリに戻る → ホーム画面表示

その後、診断機能を実行して **Workers が 200 を返すこと** を確認。401 なら audience(`aud`)ミスマッチか SHA-1 ミスマッチ。

---

## G. 段階完了の目安

- [ ] Web Client ID 取得済み
- [ ] Android Client ID(production)取得済み
- [ ] Android Client ID(dev)取得済み(`.dev` パッケージ用)
- [ ] `eas.json` の preview / production に Client ID 投入済み
- [ ] Workers 本番に `GOOGLE_CLIENT_IDS` 設定済み
- [ ] dev client ビルド + 実機で Google ログイン成功
- [ ] 診断機能まで通る(Workers 401 なし)
- [ ] ログアウト → 再ログイン → 同一 sub で KV カウンタ継続

すべて満たしたら 25 完了。

---

## H. よくあるトラブル

| 症状 | 原因 | 対処 |
|------|------|------|
| `idpiframe_initialization_failed` | Web Client ID 未投入 | `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` を確認 |
| `redirect_uri_mismatch` | パッケージ名 / SHA-1 と Client ID 設定の不一致 | Google Cloud Console で SHA-1 とパッケージ名を再確認 |
| `eas.json is not valid - ... is not allowed to be empty` | env に空文字 placeholder を書いた | 空文字キーは削除。Client ID 取得後に追記する |
| Workers が 401 を返す | `aud` クレームと `GOOGLE_CLIENT_IDS` の不一致 | Web Client ID を入れているか確認(Android ID ではない) |
| Workers が 401 で `STUB_NOT_ALLOWED` | Workers 本番に stub バイパスが効いていない(正常)、クライアントが stub を送っている | クライアントの `AUTH_MODE` を確認 |
| ログイン後アプリに戻らない | `scheme: 'uranaikikkake'` が `app.config.ts` から取れていない | `app.config.ts` を確認、`prebuild --clean` で再生成 |
| Expo Go で「Google アカウントなし」と出る | Expo Go 非対応 | EAS Dev Client ビルドを使う |

---

## 参考

- 公式: https://docs.expo.dev/guides/google-authentication/
- ID トークン audience の仕様: https://developers.google.com/identity/protocols/oauth2/openid-connect#an-id-tokens-payload
- Workers 側の検証ロジック: [`workers/src/auth.ts`](../workers/src/auth.ts)(`verifyGoogle`)
