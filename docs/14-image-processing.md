# 14. 画像処理(リサイズ / JPEG / base64)

> 関連: REQUIREMENTS.md §4.3.2, §12.4

## 概要

撮影 / 選択画像を Workers 送信用に最適化するユーティリティ。

## 前提

- [12. カメラ画面](./12-camera-screen.md) または [13. 写真選択](./13-image-picker.md)

## TODO

- [ ] `src/lib/image.ts` に `prepareForUpload(uri): Promise<{ base64: string }>` を実装
- [ ] `expo-image-manipulator` で長辺 1024px にリサイズ(`resize: { width: 1024 }` または高さ側)
- [ ] 出力: `compress: 0.8`、`format: SaveFormat.JPEG`、`base64: true`
- [ ] 戻り値の `base64` には `data:image/jpeg;base64,` プレフィックスを含めない(REQUIREMENTS §4.4.1)
- [ ] アスペクト比が縦長 / 横長どちらでも長辺基準でリサイズ

## 受入基準

- 元画像 4000x3000px の写真を 1024px 以下の base64 に変換できる
- HEIC を選んでも JPEG base64 が返る
- 1MB 以下のサイズに収まる

## 技術メモ

- `manipulateAsync` の戻り値は `{ uri, width, height, base64 }`。`base64: true` を必ず指定
- Web 版の `resizeImageForAPI` と同等仕様(REQUIREMENTS §13)
