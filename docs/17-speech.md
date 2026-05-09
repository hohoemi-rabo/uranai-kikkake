# 17. 音声読み上げ

> 関連: REQUIREMENTS.md §4.5.1, §5.3

## 概要

`expo-speech` で結果を日本語音声読み上げ。シニアの「読まなくていい」体験を提供。

## 前提

- [16. 結果画面](./16-result-screen.md)

## TODO

- [ ] `src/hooks/useSpeech.ts` 作成: `{ speak(text), stop, isSpeaking }`
- [ ] `Speech.speak(text, { language: 'ja-JP', rate: 1.0, pitch: 1.0 })`
- [ ] 読み上げ順序: 動物 → 占いメッセージ → おすすめの話題(連結 or 順次)
- [ ] ボタンは「🔊 読み上げる」/「⏸ 停止」のトグル
- [ ] 画面アンマウント時に `Speech.stop()` を呼ぶ(`useEffect` cleanup)
- [ ] iOS / Android のサイレントモード時の挙動を確認

## 受入基準

- ボタンタップで日本語音声が再生される
- 再タップで停止する
- 画面遷移で音声が止まる

## 技術メモ

- `Speech.isSpeakingAsync()` は遅延があるので、ローカルの `useState` でトラックする方が UX が良い
- 文字列の連結時は句読点で区切ると自然な間が出る
- 長文は途中で切れる端末があるので、句単位で `speak` を分けてもよい
