# 02. 権限プラグイン設定

> 関連: REQUIREMENTS.md §7.2 / CLAUDE.md「app.json / Config Plugins で権限文言を集中管理」

## 概要

カメラ・写真ライブラリ・メディア保存に必要な権限文言を、`Info.plist` / `AndroidManifest.xml` の直接編集ではなく config plugin に集約する。

## 前提

- [01. プロジェクト基盤](./01-project-foundation.md)

## TODO

- [×] `expo-camera` の plugin 設定(cameraPermission のみ。`microphonePermission: false`、`recordAudioAndroid: false`)
- [×] `expo-image-picker` の plugin 設定(photosPermission / cameraPermission、microphone は false)
- [×] `expo-media-library` の plugin 設定(photosPermission / savePhotosPermission、`isAccessMediaLocationEnabled: false` も追加)
- [×] ~~`expo-apple-authentication` の `usesAppleSignIn: true`(iOS)~~ → **フェーズ 2 / チケット 05 に移譲**(Expo Go 維持のため、フェーズ 1 では入れない)
- [×] 文言は REQUIREMENTS §7.2 の表をそのまま使う(シニアにも分かる平易な日本語)
- [×] `npx expo config --type introspect` で `Info.plist` / `AndroidManifest.xml` に反映を確認(`prebuild --clean` はチケット 23 EAS Build で初実行)

## 受入基準

- `expo config --type introspect` 出力で `NSCameraUsageDescription` / `NSPhotoLibraryUsageDescription` / `NSPhotoLibraryAddUsageDescription` が REQUIREMENTS §7.2 文言と一致(実機ダイアログ確認はチケット 12 / 23 で)
- Android `manifestApplication` の `uses-permission` 配列に `CAMERA` / `READ_MEDIA_IMAGES` / `READ_EXTERNAL_STORAGE` / `WRITE_EXTERNAL_STORAGE` が含まれる
- マイク権限が要求されない(`NSMicrophoneUsageDescription` 無し、`RECORD_AUDIO` は manifest に出ても `tools:node='remove'` が付いて最終 APK からは消える)

## 技術メモ

- plugin の文言変更は **JS リロードでは反映されない**。最終的な実機ダイアログ確認は `prebuild --clean` + ネイティブビルド or EAS Build が必要。フェーズ 1 では `expo config --type introspect` の出力で代替し、`ios/`/`android/` ディレクトリは生成しない(Expo Go 維持)
- iOS 14+ は `NSPhotoLibraryAddUsageDescription`(保存)と `NSPhotoLibraryUsageDescription`(読込)を別管理。両方文言を設定しないとストア審査で落ちる
- `expo-image-picker` と `expo-camera` はどちらも `NSCameraUsageDescription` を書き込もうとする。文言を完全一致させること
- `expo-media-library` の `isAccessMediaLocationEnabled: false` で写真の GPS メタデータ読み取り権限(`ACCESS_MEDIA_LOCATION`)を抑止
- `expo-apple-authentication` plugin はチケット 05(フェーズ 2)で同 SDK と同時に追加
