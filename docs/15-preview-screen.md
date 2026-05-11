# 15. プレビュー画面

> 関連: REQUIREMENTS.md §4.3, §4.4

## 概要

撮影/選択した画像を表示し、確認した上で診断 API を叩く。診断中はオーバーレイを表示。

## 前提

- [11. ホーム画面](./11-home-screen.md)
- [12. カメラ画面](./12-camera-screen.md) または [13. 写真選択](./13-image-picker.md)
- [14. 画像処理](./14-image-processing.md)
- [10. Gemini 連携](./10-workers-gemini.md)

## TODO

- [×] `app/(main)/preview.tsx` 作成、`mode` と画像 `uri` を受け取る
- [×] 画像を `expo-image` で表示(キャッシュ ON)
- [×] 「📷 撮り直す」「占ってみる/魅力を発見する」ボタン(モードでテキスト切替)
- [×] `hooks/useDivine.ts`: `divine(mode, base64)` で Workers POST(フラット配置)
- [×] `Authorization: Bearer {idToken}` ヘッダ、JSON body
- [×] エラーハンドリング:
  - 401 → 自動ログアウト + ログイン画面
  - 429 → 「今日はもう3回占いました。また明日会いましょう!」モーダル
  - 502 / 5xx → 「もう一度お試しください」
  - ネットワーク → 「電波の良い場所でもう一度」
- [×] `components/AnalyzingOverlay.tsx`: 半透明背景 + アニメーションスピナー + 「診断中…」(フラット配置)
- [×] 成功時 `router.replace({ pathname: '/result', params: { result: JSON.stringify(...) } })`

## 受入基準

- 画像確認 → ボタン → ローディング → 結果画面 への流れが滑らか
- 各エラー条件でユーザーフレンドリーな表示が出る
- 戻るで撮影/選択に戻れる

## 技術メモ

- `router.replace` を使うことで結果画面から戻るとホームに戻る(プレビューを履歴に残さない)
- API リクエストは中断不可で OK(タイムアウト 30 秒は Workers 側)
- **成功時の遷移はチケット 16 で `router.replace` に差し替え**: 15 段階では Alert で結果 JSON を表示。`// チケット 16 で router.replace に差し替え` コメント残し
- **`prepareForUpload`(14)の呼び出し位置は preview CTA タップ時**: プレビュー表示時に圧縮するとキャンセル時(撮り直し)に無駄。送信直前で OK
- **`.env` を新規追加**: `EXPO_PUBLIC_API_BASE_URL` が無いと `apiFetch` のベース URL が空文字列で動かない。`.env` 変更後は `npx expo start --clear` で Metro キャッシュクリア必須
