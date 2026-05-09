# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

「占いキッカケ」モバイル版。シニア層を主ターゲットにした、AI による顔相(=「魅力発見モード」)・手相・相性診断のエンタメアプリ。Expo + Expo Router で iOS / Android / Web 向けに開発する。

**現在のリポジトリ状態**: `create-expo-app` 直後のスケルトン。`app/` 配下は Expo のスターターテンプレート(`(tabs)/index.tsx`, `(tabs)/explore.tsx`, `modal.tsx`)のままで、製品コードはまだ書かれていない。設計の全体像と未実装の仕様は `REQUIREMENTS.md` に記述されている。**新機能を作る前に必ず `REQUIREMENTS.md` を読むこと。**

## 開発チケットと進捗管理

実装単位は `docs/` 配下に番号付きチケットとして分割してある。`docs/00-INDEX.md` が一覧。各チケットは:

- 概要 / 関連 REQUIREMENTS セクション / 前提(依存チケット) / TODO / 受入基準 / 技術メモ

の構成で、TODO は GitHub-flavored のチェックボックス記法で管理する:

- **未完了**: `- [ ]`
- **完了**: `- [×]`(`x` ではなく全角クロス `×`(U+00D7)を使う)

作業を始めるときは該当チケットの TODO を上から順に潰し、完了した項目はその場で `- [ ]` → `- [×]` に書き換える。チケット内のすべての TODO が `- [×]` になり、受入基準を満たしたらチケット完了。`docs/00-INDEX.md` に進捗マークは付けない(各チケットを開けば分かる)。

**新しい仕様や追加要件が出たら、対応する `docs/NN-*.md` の TODO に項目を追加すること。** 仕様だけ口頭で増やして TODO に反映しないと、後続の Claude が拾えなくなる。

## 認証は最後まで「スタブ」で開発する

`npx expo start --tunnel`(Expo Go)で開発体験を確保するため、フェーズ 1 では以下の戦略を取る:

- **04 スタブ認証**: 固定の `provider: 'stub'` トークンで全画面を開発できるようにする。Workers 側は `DEV_BYPASS_ENABLED=true` の dev 環境のみ stub を許可する。
- **25 Google ログイン(本番)**: Expo Go が使えなくなるため**フェーズ 1 の最後**に着手する。完了後は EAS Dev Client での開発に切り替える。
- **05 Apple ログイン**: **フェーズ 2 に延期**。iOS 提出も同様にフェーズ 2(Android 先行リリース)。
- 切替は `EXPO_PUBLIC_AUTH_MODE`(`stub` | `google`)と Workers の `DEV_BYPASS_ENABLED` のみで行い、コード本体に `if (isDev)` を散らさない。

**「Google 連携を入れたら Expo Go で動かなくなった」が起きないよう、25 着手のタイミングは慎重に。** 機能チケット(11〜20)が一通り `expo start --tunnel` 上で動作確認済みになってから着手すること。

## よく使うコマンド

```bash
npm start              # Expo dev server を起動(QR コード経由で接続)
npm run ios            # iOS シミュレータ起動
npm run android        # Android エミュレータ起動
npm run web            # Web 版起動
npm run lint           # expo lint(eslint-config-expo を使用)
npm run reset-project  # スターター一掃用スクリプト(本プロジェクトでは使うべきでない)
```

テストフレームワークは未導入。新規追加時は `package.json` の `scripts` も合わせて更新すること。

## アーキテクチャ

### ルーティング(Expo Router v6, file-based)

- `app/_layout.tsx` がルート Stack。`(tabs)` グループと `modal` を持つ。
- `app/(tabs)/_layout.tsx` がボトムタブ。`index.tsx` と `explore.tsx` がタブ画面。
- `app.json` で `experiments.typedRoutes: true` を有効化済み。新しいルートを追加したら `.expo/types` の型再生成のため一度 dev server を回す。
- `scheme: "uranaikikkake"` がディープリンク用に設定されている。

### TypeScript / 設定

- `tsconfig.json` は `expo/tsconfig.base` を継承し `strict: true`。
- パスエイリアス `@/*` がルートにマップされている(例: `@/hooks/use-color-scheme`、`@/constants/theme`)。新しい import もこのエイリアスで書く。
- `app.json` の `experiments.reactCompiler: true`、`newArchEnabled: true`。**React Compiler 有効下では `useMemo`/`useCallback` を手で巻かない**(コンパイラが最適化する)。

### テーマと色

- `constants/theme.ts` の `Colors`(light/dark)と `Fonts`(プラットフォーム別)が単一情報源。
- `hooks/use-theme-color.ts` 経由で参照する。新しい色を直書きせず、ここに追加する。
- ただし REQUIREMENTS §5 によると製品実装ではタブごとのアクセントカラー(コーラルピンク/ティール/オレンジ)・M PLUS Rounded 1c フォント・**ダークモード非採用**(シニア配慮)に切り替える方針。実装時は本ファイルを上書き/置換する想定。

### バックエンド構想(未実装)

REQUIREMENTS §3, §4, §7 参照。要点だけ:

- **Gemini API キーは絶対にクライアントに置かない。** Cloudflare Workers 経由で叩く。
- Workers は Google/Apple ID トークン検証 → Cloudflare KV で 1 日 3 回の利用制限管理 → Gemini 呼び出し。
- Workers 用コードは `workers/` ディレクトリに置く想定(まだ存在しない)。
- 認証は Google(`expo-auth-session`)+ Apple(`expo-apple-authentication`)。**iOS で Google ログインを提供する以上 Apple ログインは必須**(App Store Guideline 4.8)。

## 実装上の注意

- **エンタメ表示の徹底**: 占い結果がエンタメであることを、オンボーディング・結果画面・ストア説明文の 3 箇所で明示する(ストア審査要件)。
- **画像は端末/Workers/Gemini を経由するのみで保存しない**。Workers 側のログにも残さない(プライバシーポリシー宣言済み)。
- **HEIC 対応**: `expo-image-manipulator` の自動変換に任せる(専用ライブラリ不要)。送信前に最大 1024px / quality 0.8 JPEG にリサイズ。
- **シニア配慮の UI**: 大きなボタン(`p-5` 以上、`text-lg` 以上)、ダークモード非採用、平易な日本語、絵文字併用。
- **通知は実装しない**(ほほ笑みラボの一貫した方針)。

## Expo SDK 54 ベストプラクティス

context7 経由で Expo 公式ドキュメント(`sdk-54` ブランチ)から取得した、本プロジェクトに関わる現行のベストプラクティス。

### app.json / Config Plugins で権限文言を集中管理

iOS の `Info.plist` (`NSCameraUsageDescription` 等)を**直接編集しない**。各ライブラリの config plugin に渡すと、prebuild 時に自動で `Info.plist` / `AndroidManifest.xml` に反映される。文言を変えたら**ネイティブビルドのやり直しが必要**(JS リロードでは反映されない)。

```jsonc
{
  "expo": {
    "plugins": [
      "expo-router",
      ["expo-camera", {
        "cameraPermission": "人相・手相を診断するためにカメラを使用します",
        "microphonePermission": false,
        "recordAudioAndroid": false
      }],
      ["expo-image-picker", {
        "photosPermission": "お持ちの写真から診断するために使用します",
        "cameraPermission": "人相・手相を診断するためにカメラを使用します",
        "microphonePermission": false
      }],
      ["expo-media-library", {
        "photosPermission": "診断結果の画像を保存します",
        "savePhotosPermission": "診断結果の画像を保存します"
      }]
    ]
  }
}
```

### カメラ:`useCameraPermissions` フックを使う

権限の取得・確認は `Camera.requestCameraPermissionsAsync()` ではなく `useCameraPermissions` フックを使うのが SDK 54 流。`permission` が `null`(ロード中) / `granted: false`(未許可) / `granted: true` の 3 状態を必ずハンドルする。

```tsx
import { CameraView, useCameraPermissions } from 'expo-camera';
const [permission, requestPermission] = useCameraPermissions();
if (!permission) return null;            // loading
if (!permission.granted) return <RequestPermissionUI onPress={requestPermission} />;
return <CameraView facing={facing} />;
```

### expo-secure-store:ID トークンの保管に必ず使う

Google/Apple の `id_token` を `AsyncStorage` ではなく **`SecureStore` に保存する**(REQUIREMENTS §4.1 でも指定)。iOS は Keychain、Android は EncryptedSharedPreferences を使うため、平文ストレージより圧倒的に安全。

```tsx
import * as SecureStore from 'expo-secure-store';
await SecureStore.setItemAsync('idToken', token);
const token = await SecureStore.getItemAsync('idToken');
```

`AsyncStorage` はオンボーディング完了フラグなど非機密データ専用に。

### 環境変数の使い分け

| 種類 | どこに置く | クライアントから見える? | 用途 |
|------|----------|-----------------------|------|
| `EXPO_PUBLIC_*` | `.env` / EAS Build profile の `env` | ✅(JS バンドルに展開) | API ベース URL、Google OAuth クライアント ID |
| EAS Secret(`eas secret:create`) | EAS サーバ | ❌(ビルド環境にのみ注入) | 署名証明書情報など |
| Workers の `wrangler secret` | Cloudflare 側 | ❌ | `GEMINI_API_KEY`、`APPLE_BUNDLE_ID` 等 |

**`EXPO_PUBLIC_` プレフィックスがない変数はクライアントから参照できない**。逆にプレフィックス付きの変数は最終バイナリに**インライン展開されるため、機密情報を入れないこと**(Gemini キーなどは絶対に Workers 側のみ)。

### eas.json:プロファイル別のビルド構成

`development`(internal distribution + dev client)/ `preview`(internal、TestFlight 相当)/ `production` の 3 プロファイル構成が基本。`extends` で共通設定を継承し、`env` でプロファイル別の `EXPO_PUBLIC_API_BASE_URL` を切り替えると、Workers の dev/prod 環境を分離できる。

### app.config.ts による動的設定

バンドル ID やアプリ名を環境変数で切り替えたい場合は `app.json` を `app.config.ts` に置き換える(両方は不可)。

```ts
// app.config.ts
export default () => ({
  expo: {
    name: process.env.APP_ENV === 'production' ? '占いキッカケ' : '占いキッカケ (Dev)',
    ios: {
      bundleIdentifier: process.env.APP_ENV === 'production'
        ? 'jp.hohoemi-rabo.uranaikikkake'
        : 'jp.hohoemi-rabo.uranaikikkake.dev',
    },
  },
});
```

dev/prod を別アプリとして共存インストールできるので、TestFlight/Internal Testing と本番版の同居が可能になる。

### New Architecture(Fabric/TurboModules)

`newArchEnabled: true` を変えた、または `expo-camera` 等のネイティブモジュールの追加・削除があれば、`npx expo prebuild --clean` でネイティブプロジェクトを再生成 → `npx expo run:ios` / `run:android` で再ビルド。Expo Go では再現できないクラッシュは New Arch 互換性が原因のことが多い。

### React Compiler 有効下のコーディング

- `useMemo` / `useCallback` / `React.memo` は**書かない**(コンパイラが自動で最適化)。書いてあると逆にコンパイラが介入を諦めるケースがある。
- ただし副作用のあるフック(`useEffect` の依存配列など)は従来通り正しく書く必要がある。
- コンパイラが対応するのは Rules of React に従ったコードのみ。条件付きフック呼び出しなどは引き続き禁止。

### Expo Router の認証ガードパターン

REQUIREMENTS §4.1 のログインゲートは `app/(auth)/` と `app/(main)/` のグループ分割で実装する。ルート `_layout.tsx` で SecureStore のトークン有無を見て、未認証なら `<Redirect href="/(auth)/login" />`、認証済みなら `<Redirect href="/(main)" />` を返す。`typedRoutes: true` 有効時は `href` も型チェックされる。

### Server Components / `server-only`

将来 Workers ではなく Expo Router の RSC(Server Components)で API を組むなら、`import 'server-only'` を機密処理を含むモジュール先頭に書くと、**誤ってクライアントに含まれた瞬間に実行時エラー**を出してくれる。本プロジェクトはバックエンドを Workers に分離する方針なので原則使わないが、知っておくと安心。

## Git 運用

- `main` への直接コミットは避ける(global CLAUDE.md 指針)。フェーズ 1 開発中はトピックブランチを使う。
- コミットメッセージはコンベンショナルコミット形式を英語で。
