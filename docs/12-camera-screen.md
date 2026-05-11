# 12. カメラ画面

> 関連: REQUIREMENTS.md §4.3, §4.3.1, §12.3 / CLAUDE.md「`useCameraPermissions` フック」

## 概要

`expo-camera` でモード別フレームを表示し、撮影画像を次のプレビュー画面に渡す。

## 前提

- [02. 権限プラグイン設定](./02-permissions-plugins.md)
- [11. ホーム画面](./11-home-screen.md)

## TODO

- [×] `app/(main)/camera.tsx` 作成、クエリパラメータで `mode` を受け取る
- [×] `useCameraPermissions` で許可確認(loading / not granted / granted の 3 状態)
- [×] 未許可時は説明テキスト + 再リクエストボタン、設定アプリへの誘導リンク
- [×] `CameraView` で全画面プレビュー、`facing` を front/back 切替
- [×] モード別フレームオーバーレイ:
  - 魅力発見: 中央に円形枠「ここに顔を合わせてね」
  - 手相: 縦長枠「手のひらを映してね」
  - 相性: 横並び 2 枠「1人目」「2人目」
- [×] フレーム枠線色は選択モードのアクセントカラー
- [×] シャッターボタンは画面下部、`p-6` 以上
- [×] 撮影 → プレビュー画面へ `router.push({ pathname: '/preview', params: { mode, uri } })`

## 受入基準

- 実機(iOS / Android)で前面・背面カメラが切り替わる
- モード別にフレームが正しく出る
- 権限拒否でも画面が落ちず、再リクエストできる

## 技術メモ

- iOS シミュレータではカメラ動作不可。実機テスト必須
- 撮影画像の URI は一時ファイル。次画面に渡したらすぐ使う
- `flash` は使わない(シニア向け、明るい場所での撮影前提)
- **撮影完了 → プレビュー画面遷移はチケット 15 で本実装**: 12 段階では `Alert.alert` で URI を表示するスタブ。15 着手時に `router.push({ pathname: '/(main)/preview', params: { mode, uri } })` に差し替え(コメント `// チケット 15 でプレビュー画面遷移に差し替え` で grep 可)
- **`facing` 初期値はモード依存**: charm=`'front'`(セルフィー)/ palm/match=`'back'`。`useState` 初期値を mode で分岐
- **`takePictureAsync` は `null` を返す可能性あり**: `if (!photo) throw new Error(...)` でガード。React の型上は optional だが、ランタイムでも `null` を観測することがある
- **設定アプリ誘導は `Linking.openSettings()` から**: `react-native` 標準の `Linking`(`expo-linking` ではない)。OS の許可画面に直接飛ばす
