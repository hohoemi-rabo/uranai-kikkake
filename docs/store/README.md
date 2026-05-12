# ストア提出ドラフト

`docs/store/` 配下は Google Play ストアへの提出に必要な情報・回答案・チェックリストのドラフトです。
**チケット 25(Google ログイン)完了後** に、ユーザーが Play Console を開いたとき、
ここの内容をコピペで投入できる状態で揃えています。

## 一覧

| ファイル | 内容 |
|---------|------|
| [`play-listing-draft.md`](./play-listing-draft.md) | アプリ名・短い説明・詳細な説明・カテゴリ・連絡先 |
| [`data-safety-answers.md`](./data-safety-answers.md) | データセーフティフォーム回答 |
| [`content-rating.md`](./content-rating.md) | IARC コンテンツレーティング質問票回答 |
| [`review-notes.md`](./review-notes.md) | Google レビュアー向け補足メモ |
| [`screenshot-guide.md`](./screenshot-guide.md) | スクリーンショット撮影手順(25 完了後) |
| [`submission-checklist.md`](./submission-checklist.md) | 提出前チェックリスト |

## 関連

- 親チケット: [`../24-store-submission.md`](../24-store-submission.md)
- アイコン素材: `assets/store/`(チケット 22 で生成済み)
- ポリシー URL: https://hohoemi-rabo.github.io/uranai-kikkake/legal/

## 提出までの流れ(全体像)

```
[A] チケット 25 完了            ← 未着手
       ↓
[B] 本番 Workers デプロイ       ← 未着手
       ↓
[C] eas.json 本番 URL 反映     ← 未着手
       ↓
[D] eas build --production    ← 未着手
       ↓
[E] スクリーンショット撮影      ← screenshot-guide.md
       ↓
[F] Play Console アカウント開設(初回 25 USD)
       ↓
[G] ストア掲載情報入力         ← play-listing-draft.md
       ↓
[H] データセーフティ・レーティング ← data-safety-answers.md / content-rating.md
       ↓
[I] eas submit --platform android
       ↓
[J] Internal → Closed → Open → Production
```

本ドラフトでは [G]〜[J] の **入力ネタ** を準備しています。
