# 18. 結果画像のカメラロール保存

> 関連: REQUIREMENTS.md §4.5.2

## 概要

`react-native-view-shot` で結果カードをキャプチャし、`expo-media-library` でカメラロールに保存。

## 前提

- [02. 権限プラグイン設定](./02-permissions-plugins.md)
- [16. 結果画面](./16-result-screen.md)

## TODO

- [×] `react-native-view-shot` を導入
- [×] `components/ResultCard.tsx`: 保存用レイアウト(1080×自動高、4:5 目安)
  - ヘッダー: アプリ名「占いキッカケ」+ モード名
  - 写真 / タイトル / 動物 / スコア(相性のみ)/ メッセージ / アイテム&アドバイス / おすすめの話題
  - フッター: 日付 + アプリ名
- [×] `hooks/useSaveImage.ts`: `captureRef(viewRef)` → `MediaLibrary.saveToLibraryAsync(uri)`
- [×] 保存前に `MediaLibrary.requestPermissionsAsync()` で権限確認
- [×] 保存成功時の通知「写真アプリに保存しました!」(`Alert.alert` でシンプル実装)
- [×] 失敗時は穏やかなエラーメッセージ

## 受入基準

- ボタンタップでカメラロールに JPG/PNG が保存される
- 写真アプリで開ける
- 権限未許可時は穏やかにリクエストが出る

## 技術メモ

- `captureRef` は内部で `View` を画像化。レンダリング完了後に呼ぶこと
- 画像サイズは固定 1080px 幅(ストア用も兼ねる)
- iOS の Limited Photos モードでも `saveToLibraryAsync` は動く
- ファイル配置は `src/components/` `src/hooks/` ではなく **`components/` `hooks/` フラット**(リポジトリ慣習)
- ResultCard は **off-screen 配置で常時マウント**(`position: 'absolute', top: -10000, opacity: 0, pointerEvents: 'none'` の四重防御)。タップ時にマウント→キャプチャは ref が null になる事故あり
- ResultCard の root View に **`collapsable={false}`** 必須(Android view-flattening 対策)
- ResultCard の幅(`width: 1080`)と `captureRef` の `width: 1080` を両側で揃える(片方だけだとスケール劣化)
- `router.replace` の params に **元画像 URI(`uri`)を追加**。リサイズ前の原本を渡す(API 送信用の圧縮版は別途 `prepareForUpload` 経由)
- 通知は Alert で十分(シニア向けに確実なフィードバック優先、Toast ライブラリ導入なし)
