# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

「占いキッカケ」モバイル版。Expo + Cloudflare Workers + Gemini で、AI による顔相(=魅力発見)・手相・相性診断を提供するエンタメアプリ。シニア層がメインターゲット。

設計の全体像は `REQUIREMENTS.md`、実装は `docs/00-INDEX.md` から番号付きチケットで管理する。

**現在のリポジトリ状態**: `create-expo-app` 直後のスケルトン。`app/` 配下は Expo のスターターテンプレートのままで、製品コードは未着手。新機能着手前に `REQUIREMENTS.md` と該当チケット(`docs/NN-*.md`)を必ず読むこと。

## ディレクトリ別ルール

context 削減のため、詳細ルールは作業対象ディレクトリの `CLAUDE.md` に分離している。**このルートファイルはプロジェクト横断のルールのみ。**

| 対象ディレクトリ | 場所 | 何が書いてあるか |
|------|------|----------------|
| `app/` 配下のコード | [`app/CLAUDE.md`](./app/CLAUDE.md) | Expo Router、React Compiler、NativeWind、テーマ、カメラ/画像/権限、シニア配慮 UI |
| `workers/` 配下のコード | [`workers/CLAUDE.md`](./workers/CLAUDE.md) | jose 検証、KV キー設計、Gemini 呼び出し、stub バイパス、CORS、ログ取扱 |
| `docs/` 配下のチケット | [`docs/CLAUDE.md`](./docs/CLAUDE.md) | TODO 記法、チケット構成テンプレート、番号運用 |

作業対象のディレクトリに移動した時点で、その階層の `CLAUDE.md` が自動で読み込まれる(Claude Code 仕様)。**ルートのこのファイルに細かいライブラリ仕様や実装パターンを書き戻さないこと。** 新しいルールを追加するときは、まず該当ディレクトリの `CLAUDE.md` に書く。

## よく使うコマンド

```bash
npm start              # Expo dev server(QR で接続)
npm run ios            # iOS シミュレータ
npm run android        # Android エミュレータ
npm run web            # Web 版
npm run lint           # expo lint
```

テストフレームワークは未導入。

## 開発チケットと進捗管理

実装単位は `docs/` 配下に番号付きチケットとして分割。`docs/00-INDEX.md` が一覧、TODO 記法・テンプレートは [`docs/CLAUDE.md`](./docs/CLAUDE.md) を参照。

**新しい仕様や追加要件が出たら、対応する `docs/NN-*.md` の TODO に項目を追加すること。** 仕様だけ口頭で増やして反映しないと、後続の Claude が拾えなくなる。

### チケット完了時に CLAUDE.md を自発更新する

チケットのすべての TODO が `- [×]` になり受入基準を満たしたら、**ユーザーに依頼される前に**「未来の Claude が同じ罠にハマらないためのヒント」を該当階層の `CLAUDE.md` に追記する。振り分けルール:

| 知見の種類 | 更新先 |
|----------|--------|
| Expo Router / React Compiler / NativeWind / カメラ / 画像 / SecureStore / Speech / Config Plugins | [`app/CLAUDE.md`](./app/CLAUDE.md) |
| jose / KV / Gemini / wrangler / CORS / ログ取扱 | [`workers/CLAUDE.md`](./workers/CLAUDE.md) |
| TODO 記法 / チケット運用 / 番号管理 | [`docs/CLAUDE.md`](./docs/CLAUDE.md) |
| プロジェクト横断のコマンド / 環境変数 / Git / 認証戦略 | このファイル(root) |

書く内容は **「未来の Claude が同じ罠にハマらないためのヒント」に絞る**。チケットそのものの内容を転記しない(チケットを読めば分かる情報は不要)。判断に迷う・複数階層に跨がる場合のみユーザーに確認する。

## 認証は最後まで「スタブ」で開発する

`npx expo start --tunnel`(Expo Go)で開発体験を確保するため、フェーズ 1 では:

- **04 スタブ認証** で全機能を開発
- **25 Google ログイン** は機能チケット(11〜20)が一通り完了してから着手(着手後は Expo Go が使えなくなる)
- **05 Apple ログイン** はフェーズ 2(iOS 提出も同様、Android 先行リリース)

切替は `EXPO_PUBLIC_AUTH_MODE`(`stub` | `google`)と Workers の `DEV_BYPASS_ENABLED` のみで行い、コード本体に `if (isDev)` を散らさない。

## 環境変数の使い分け(横断ルール)

| 種類 | どこに置く | クライアントから見える? | 用途 |
|------|----------|-----------------------|------|
| `EXPO_PUBLIC_*` | `.env` / EAS Build profile の `env` | ✅(JS バンドルに展開) | API ベース URL、Google OAuth Client ID、`AUTH_MODE` |
| EAS Secret(`eas secret:create`) | EAS サーバ | ❌ | 署名証明書情報など |
| `wrangler secret` | Cloudflare 側 | ❌ | `GEMINI_API_KEY`、`GOOGLE_CLIENT_IDS`、`APPLE_BUNDLE_ID` |

**`EXPO_PUBLIC_*` はバイナリにインライン展開される**ため、機密情報を入れない。Gemini キーなどは Workers 側 secret のみ。

## Git 運用

- `main` への直接コミットは避ける(global CLAUDE.md 指針)
- コミットメッセージはコンベンショナルコミット形式を英語で(`feat:`, `fix:`, `docs:`, `refactor:`, `chore:`)
- コミットは原子的、単一の変更に焦点を当てる
