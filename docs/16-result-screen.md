# 16. 結果画面

> 関連: REQUIREMENTS.md §4.5, §5.1, §5.4

## 概要

診断結果を段階的アニメーションで表示。タイプライター、音声読み上げボタン、画像保存ボタンを含む。

## 前提

- [15. プレビュー画面](./15-preview-screen.md)
- [17. 音声読み上げ](./17-speech.md)(ボタン連動)
- [18. 結果画像保存](./18-save-result-image.md)(ボタン連動)

## TODO

- [×] `app/(main)/result.tsx` 作成、`result` JSON と `mode` を受け取る
- [×] 表示順序のアニメーション(`react-native-reanimated`):
  1. タイトル + スコア(相性のみ)フェードイン
  2. 動物 + 絵文字スライドアップ
  3. メッセージ(タイプライター 35ms 間隔)
  4. 開運アイテム & アドバイスカード
  5. おすすめの話題
- [×] `components/TypewriterText.tsx`: 文字を 1 文字ずつ追加(`setInterval` ベース)
- [×] アクセントカラーがモードに応じてカード左ボーダー・見出し色に反映
- [×] エンタメ注釈を画面下部に小さく表示(REQUIREMENTS §5.4 + §12.5)
- [×] 「🔊 読み上げる」ボタン → 17 のフックを呼ぶ(17 着手まで Alert スタブ + `// チケット 17 で …` コメント)
- [×] 「💾 画像を保存」ボタン → 18 のフックを呼ぶ(18 着手まで Alert スタブ + `// チケット 18 で …` コメント)
- [×] 「最初に戻る」ボタンでホーム画面に戻る

## 受入基準

- 結果が段階的にスムーズに表示される
- タイプライターが完了するまで他のセクションが隠れない、または順次表示される
- 画面遷移時に音声が自動停止する(17 と連動)

## 技術メモ

- `useEffect` の cleanup で `setInterval` を必ず止める
- Reanimated の `withDelay` + `withTiming` で並列スタガー(`withSequence` は使わなくて済む)
- カードの背景色は REQUIREMENTS §5.1.1 を踏襲(amber-50 / emerald-50)
- ファイル配置は `src/components/...` ではなく **`components/...` フラット**(リポジトリ慣習)
- `result` クエリは `JSON.stringify` 済み文字列で渡し、受け側で try/catch + フィールド存在チェック。不正なら `router.replace('/(main)')`
- 段階表示は **`withDelay` 並列スタガー**方式(各セクション独立に `useSharedValue` + `useEffect`)。タイプライター完了は callback ではなく **時間予測**(`personality.length * 35ms` を上限 9s で cap)で後続セクションの delay に組み込む
- 動的アクセント色は className 文字列補間ではなく `style={{ borderLeftColor: Colors[mode] }}` で当てる(NativeWind の purge 対策)
