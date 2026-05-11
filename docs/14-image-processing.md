# 14. 画像処理(リサイズ / JPEG / base64)

> 関連: REQUIREMENTS.md §4.3.2, §12.4

## 概要

撮影 / 選択画像を Workers 送信用に最適化するユーティリティ。

## 前提

- [12. カメラ画面](./12-camera-screen.md) または [13. 写真選択](./13-image-picker.md)

## TODO

- [×] `lib/image.ts` に `prepareForUpload(uri): Promise<PreparedImage>` を実装(フラット配置、戻り値は `{ base64, width, height, sizeKb }` に拡張)
- [×] `expo-image-manipulator` で長辺 1024px にリサイズ(`resize: { width: 1024 }` または高さ側)
- [×] 出力: `compress: 0.8`、`format: SaveFormat.JPEG`、`base64: true`
- [×] 戻り値の `base64` には `data:image/jpeg;base64,` プレフィックスを含めない(REQUIREMENTS §4.4.1)
- [×] アスペクト比が縦長 / 横長どちらでも長辺基準でリサイズ

## 受入基準

- 元画像 4000x3000px の写真を 1024px 以下の base64 に変換できる
- HEIC を選んでも JPEG base64 が返る
- 1MB 以下のサイズに収まる

## 技術メモ

- `manipulateAsync` の戻り値は `{ uri, width, height, base64 }`。`base64: true` を必ず指定
- Web 版の `resizeImageForAPI` と同等仕様(REQUIREMENTS §13)
- **ファイル配置はフラット `lib/image.ts`**(プロジェクト全体で `src/` を採用していない)
- **呼び出し元の本筋はチケット 16**(`/api/divine` 送信直前): プレビュー画面では原本を見せ、API 送信時にだけ圧縮するのが UX・効率上最適
- **14 段階の実機検証は 12/13 の Alert に一時組み込み**: 撮影 / 選択完了 Alert で「処理後: WxH JPEG」「base64: N kB」を表示。15/16 着手時に Alert ごと撤去して `router.push` / `apiFetch` に置換
- **アップスケール防止**は `Math.min(MAX_LONG_SIDE, dim)` で実現(`resize: { width: 1024 }` は元画像が小さくても 1024 に拡大する挙動)
- **HEIC 自動 JPG 変換**は `SaveFormat.JPEG` 指定のみで完結。専用ライブラリ不要
- **Config Plugin 不要**: `expo-image-manipulator` はネイティブ権限を要求しない純粋な画像変換ライブラリ
