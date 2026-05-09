# 02. 権限プラグイン設定

> 関連: REQUIREMENTS.md §7.2 / CLAUDE.md「app.json / Config Plugins で権限文言を集中管理」

## 概要

カメラ・写真ライブラリ・メディア保存に必要な権限文言を、`Info.plist` / `AndroidManifest.xml` の直接編集ではなく config plugin に集約する。

## 前提

- [01. プロジェクト基盤](./01-project-foundation.md)

## TODO

- [ ] `expo-camera` の plugin 設定(cameraPermission のみ。`microphonePermission: false`、`recordAudioAndroid: false`)
- [ ] `expo-image-picker` の plugin 設定(photosPermission / cameraPermission、microphone は false)
- [ ] `expo-media-library` の plugin 設定(photosPermission / savePhotosPermission)
- [ ] `expo-apple-authentication` の `usesAppleSignIn: true`(iOS)
- [ ] 文言は REQUIREMENTS §7.2 の表をそのまま使う(シニアにも分かる平易な日本語)
- [ ] `npx expo prebuild --clean` で `Info.plist` / `AndroidManifest.xml` に反映を確認

## 受入基準

- iOS シミュレータでカメラアクセス時に指定文言のダイアログが出る
- Android で `READ_MEDIA_IMAGES` 等が manifest にある(`adb shell dumpsys package <pkg>`)
- マイク権限が要求されない

## 技術メモ

- plugin の文言変更は **JS リロードでは反映されない**。必ず `prebuild --clean` + ネイティブビルド
- iOS 14+ は `NSPhotoLibraryAddUsageDescription`(保存)と `NSPhotoLibraryUsageDescription`(読込)を別管理
