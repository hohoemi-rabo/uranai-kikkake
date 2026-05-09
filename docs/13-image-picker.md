# 13. 写真選択

> 関連: REQUIREMENTS.md §4.3, §12.3

## 概要

`expo-image-picker` でフォトライブラリから画像を選択し、プレビュー画面に渡す。

## 前提

- [02. 権限プラグイン設定](./02-permissions-plugins.md)
- [11. ホーム画面](./11-home-screen.md)

## TODO

- [ ] ホーム画面の「📁 写真から選ぶ」ボタンに `launchImageLibraryAsync` をバインド
- [ ] オプション: `mediaTypes: ['images']`、`allowsEditing: false`、`quality: 1`(リサイズは 14 で行う)
- [ ] 選択結果(`canceled === false`)があればプレビュー画面へ遷移
- [ ] HEIC が選ばれても次工程の `expo-image-manipulator` が JPG に変換するので前処理不要
- [ ] 権限拒否時はカメラ画面と同様の UX

## 受入基準

- iOS / Android でフォトライブラリが開き、画像選択 → プレビューに遷移
- HEIC ファイルでもエラーなく次へ進める

## 技術メモ

- `expo-image-picker` は SDK 54 では新パーミッション API(`getMediaLibraryPermissionsAsync` / `requestMediaLibraryPermissionsAsync`)
- iOS 14+ の限定的アクセス(Limited Photos)でも動作することを確認
