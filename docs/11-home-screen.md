# 11. ホーム画面

> 関連: REQUIREMENTS.md §4.2.3, §4.3, §5.1, §5.5

## 概要

タブ切替(魅力発見 / 手相 / 相性)と、残り回数バッジ、カメラ・写真選択ボタンを配置するホーム画面。

## 前提

- [01. プロジェクト基盤](./01-project-foundation.md)
- [06. 認証コンテキスト](./06-auth-context-securestore.md)

## TODO

- [ ] `app/(main)/index.tsx` 作成
- [ ] `src/components/TabSwitcher.tsx`: 3 タブ(🌟魅力発見 / ✋手相 / 💖相性)、選択タブのアクセントカラー連動
- [ ] `src/components/UsageBadge.tsx`: 「今日の残り: N回」を右上表示
- [ ] 残り回数は API レスポンスの `usage` を AsyncStorage / Context に保存し、画面復帰時に表示
- [ ] 「📷 カメラ」「📁 写真から選ぶ」ボタン(残り 0 回時はグレーアウト)
- [ ] タブ切替時、撮影フレーム枠線・ボタン背景・ヒントテキストの色が連動
- [ ] 設定画面アイコン(右上、歯車)→ `/(main)/settings` へ遷移
- [ ] ヒントテキスト「タップしてはじめよう」を選択タブの色で点滅(`useSharedValue` + `withRepeat`)

## 受入基準

- 3 タブの切替で全アクセント色が同時に変わる
- 残り回数 0 でボタンが無効化される
- ホーム → カメラ → 戻る、で残り回数が更新される

## 技術メモ

- React Compiler 有効下では `useMemo`/`useCallback` を書かない
- タブの状態は `useState`、グローバル化しない(画面ローカルで十分)
