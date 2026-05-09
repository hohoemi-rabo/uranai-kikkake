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

- [ ] `eas-cli` 導入、`eas login`
- [ ] `eas init` で project を Expo クラウドにリンク
- [ ] `eas.json` に 3 プロファイル定義:
  - `development`: `developmentClient: true`、`distribution: internal`、`env.APP_ENV=development`、`EXPO_PUBLIC_AUTH_MODE=stub`
  - `preview`: `distribution: internal`、`env.APP_ENV=preview`、`EXPO_PUBLIC_AUTH_MODE=google`、Workers のステージング URL
  - `production`: `env.APP_ENV=production`、`EXPO_PUBLIC_AUTH_MODE=google`、Workers の本番 URL
- [ ] `EXPO_PUBLIC_GOOGLE_*_CLIENT_ID` を `eas.json` の `env` または EAS Secret に登録
- [ ] Android キーストア: EAS が自動生成 → SHA-1 を Google Cloud Console に登録(25 と関連)
- [ ] `eas build --profile preview --platform android` で Android ビルドが通ることを確認
- [ ] Internal Testing にアップロード
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
