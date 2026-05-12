# 17. 音声読み上げ

> 関連: REQUIREMENTS.md §4.5.1, §5.3

## 概要

`expo-speech` で結果を日本語音声読み上げ。シニアの「読まなくていい」体験を提供。

## 前提

- [16. 結果画面](./16-result-screen.md)

## TODO

- [×] `hooks/useSpeech.ts` 作成: `{ speak(parts: string[]), stop, isSpeaking }`
- [×] `Speech.speak(text, { language: 'ja-JP', rate: 1.0, pitch: 1.0 })`
- [×] 読み上げ順序: 動物 → 占いメッセージ → おすすめの話題(順次・内蔵キュー利用)
- [×] ボタンは「🔊 読み上げる」/「⏸ 停止」のトグル
- [×] 画面アンマウント時に `Speech.stop()` を呼ぶ(`useEffect` cleanup)
- [×] iOS / Android のサイレントモード時の挙動を確認(フェーズ 1 は Android 実機/エミュレータで確認、iOS はフェーズ 2)

## 受入基準

- ボタンタップで日本語音声が再生される
- 再タップで停止する
- 画面遷移で音声が止まる

## 技術メモ

- `Speech.isSpeakingAsync()` は遅延があるので、ローカルの `useState` でトラックする方が UX が良い
- ファイル配置は `src/hooks/...` ではなく **`hooks/...` フラット**(リポジトリ慣習)
- 順次再生は `Speech.speak()` を 3 回呼ぶだけで **内蔵キュー**が回す(自前で `onDone` チェーンしない)。最後の発話のみ `onDone` で `setIsSpeaking(false)`
- 連打対策で `speak()` の冒頭に `Speech.stop()` を入れる(冪等、前の発話キューを必ずクリア)
- `onStopped` は全発話に同じ handler を載せて冪等下げ(Android は各キューエントリで発火しうる)
- `expo-speech` は **Config Plugin 不要**(マイク権限を要求しない)。`npx expo install expo-speech` だけで完結
- 読み上げ対象は **動物 / メッセージ / おすすめの話題** の 3 フィールドのみ(REQUIREMENTS §4.5.1)。`title` / `luckyItem` / `advice` は含めない
