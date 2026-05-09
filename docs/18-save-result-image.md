# 18. 結果画像のカメラロール保存

> 関連: REQUIREMENTS.md §4.5.2

## 概要

`react-native-view-shot` で結果カードをキャプチャし、`expo-media-library` でカメラロールに保存。

## 前提

- [02. 権限プラグイン設定](./02-permissions-plugins.md)
- [16. 結果画面](./16-result-screen.md)

## TODO

- [ ] `react-native-view-shot` を導入
- [ ] `src/components/ResultCard.tsx`: 保存用レイアウト(1080×自動高、4:5 目安)
  - ヘッダー: アプリ名「占いキッカケ」+ モード名
  - 写真 / タイトル / 動物 / スコア(相性のみ)/ メッセージ / アイテム&アドバイス / おすすめの話題
  - フッター: 日付 + アプリ名
- [ ] `src/hooks/useSaveImage.ts`: `captureRef(viewRef)` → `MediaLibrary.saveToLibraryAsync(uri)`
- [ ] 保存前に `MediaLibrary.requestPermissionsAsync()` で権限確認
- [ ] 保存成功時のトースト「写真アプリに保存しました!」(`react-native` のシンプル実装で OK)
- [ ] 失敗時は穏やかなエラーメッセージ

## 受入基準

- ボタンタップでカメラロールに JPG/PNG が保存される
- 写真アプリで開ける
- 権限未許可時は穏やかにリクエストが出る

## 技術メモ

- `captureRef` は内部で `View` を画像化。レンダリング完了後に呼ぶこと
- 画像サイズは固定 1080px 幅(ストア用も兼ねる)
- iOS の Limited Photos モードでも `saveToLibraryAsync` は動く
