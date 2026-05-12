# 23. EAS Build 設定

> 関連: REQUIREMENTS.md §2.4, §10 / CLAUDE.md「eas.json」

## 概要

EAS Build で Android(フェーズ 1)/ iOS(フェーズ 2)の本番ビルドを生成できるようにする。

## 前提

- [01. プロジェクト基盤](./01-project-foundation.md)
- [22. アイコン・スプラッシュ](./22-assets-icon-splash.md)
- [25. Google ログイン](./25-auth-google.md)(本番ビルドには必須。スタブのままストア提出はしない)
- 全機能チケットの動作確認

## TODO

- [×] `eas-cli` 導入、`eas login`(v18.11.0、hohoemirabo でログイン済み)
- [×] `eas init` で project を Expo クラウドにリンク(projectId: `031e6171-96a4-4eec-852b-a304c30ed32e`)
- [×] `eas.json` に 3 プロファイル定義(development / preview / production)+ submit セクション
- [ ] `EXPO_PUBLIC_GOOGLE_*_CLIENT_ID` を `eas.json` の `env` または EAS Secret に登録 → **チケット 25 で対応**
- [ ] Android キーストア: 初回 `eas build` で自動生成 → SHA-1 を Google Cloud Console に登録 → **チケット 25 で対応**
- [ ] `eas build --profile preview --platform android` で Android ビルドが通ることを確認 → **ユーザーが実行**(EAS クレジット消費)
- [ ] Internal Testing にアップロード → **チケット 24 で対応**
- [ ] **iOS 関連はフェーズ 2 で着手**(Apple Developer 契約も含む)

## 受入基準

- Internal Testing で Android 実機にインストールできる
- dev / preview / production が別アプリとして共存できる(`bundleIdentifier` 切替)
- `development` プロファイルではスタブログインで動作する

## 技術メモ

- 初回 Android ビルドは Play Console(初回 25 USD)必須
- iOS ビルド(フェーズ 2)時には Apple Developer Program(年 12,800 円)必須
- 設定変更後は **`prebuild --clean` + 再ビルド**(JS リロード不可)
- `EXPO_PUBLIC_AUTH_MODE` を profile ごとに切り替えると、preview で本番認証、dev でスタブと使い分けられる
- **3 プロファイルの違い**:
  - `development`: dev client + APK + stub auth + APP_ENV=development → bundleId は `.dev` 付き(`占いキッカケDev`)
  - `preview`: APK + google auth + APP_ENV=preview → bundleId は `.dev` 付き(Internal Testing 用、本番認証で動作テスト)
  - `production`: AAB + google auth + APP_ENV=production + `autoIncrement: true` → bundleId clean(`占いキッカケ`、Play Store 提出用)
- **Workers production URL は一旦 dev URL を流用**: チケット 24 で本番 Workers (`uranai-kikkake-api.rabo-hohoemi.workers.dev`) をデプロイ後、`eas.json` の `production.env.EXPO_PUBLIC_API_BASE_URL` を差し替え
- **`EXPO_PUBLIC_GOOGLE_*_CLIENT_ID` は現状未定義**: 25 で iOS/Android/Web の Client ID を取得後、`eas.json` の preview/production env に追加(or `eas secret:create` で機密管理)
- **キーストア**: EAS が初回ビルド時に自動生成、`eas credentials -p android` で SHA-1 取得可能。**reset は既リリース後 NG**(アプリ更新が出せなくなる)
- **`eas.json` の env が `.env` より優先**(EAS Build 中)。ローカル `npm start` は `.env` を読む
- **submit profile の `track: "internal"`**: Play Console の Internal Testing に提出。release への promote は Play Console UI で手動
