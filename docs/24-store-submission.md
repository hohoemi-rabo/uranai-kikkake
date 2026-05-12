# 24. ストア提出(Android 先行 / iOS はフェーズ 2)

> 関連: REQUIREMENTS.md §8

## 概要

フェーズ 1 では **Google Play への Android 提出のみ**。iOS App Store はフェーズ 2 に延期。

## 前提

- [21. ポリシーページ](./21-policy-pages.md)
- [23. EAS Build](./23-eas-build.md)
- [25. Google ログイン](./25-auth-google.md)

## TODO(フェーズ 1: Android)

ドラフト準備完了マーク `[〜]` = `docs/store/` 配下にコピペ用のドラフトあり、Play Console 入力はユーザー手動。

- [ ] Play Console でアプリ作成、Package: `jp.hohoemi-rabo.uranaikikkake`(ユーザー手動、25 USD アカウント開設後)
- [×] 機能グラフィック(1024×500)準備 — `assets/store/play-feature-graphic-1024x500.png`(チケット 22 で生成)
- [ ] スクリーンショット撮影 — 手順は [`store/screenshot-guide.md`](./store/screenshot-guide.md)、25 完了後に実機 / エミュレータで撮影
- [〜] 短い説明 / 詳細な説明 — [`store/play-listing-draft.md`](./store/play-listing-draft.md) でドラフト準備済み
- [〜] サブタイトル: 「会話がもっと楽しくなる」 — 同上
- [〜] カテゴリ: **エンターテイメント** — 同上
- [〜] データセーフティフォーム — [`store/data-safety-answers.md`](./store/data-safety-answers.md) で回答案準備済み
- [〜] コンテンツレーティング: 全年齢 — [`store/content-rating.md`](./store/content-rating.md) で回答案準備済み
- [×] プライバシーポリシー URL — `https://hohoemi-rabo.github.io/uranai-kikkake/legal/privacy.html`(チケット 21 で公開済み)
- [ ] `eas submit --platform android` — チケット 25 完了 + 本番 Workers デプロイ + production ビルド後
- [ ] Internal → Closed → Open Testing → Production の段階を踏む — チェックリスト: [`store/submission-checklist.md`](./store/submission-checklist.md)

## TODO(フェーズ 2: iOS)

- [ ] Apple Developer Program 加入
- [ ] チケット 05(Apple ログイン)を完了
- [ ] App Store Connect でアプリレコード作成、Bundle ID: `jp.hohoemi-rabo.uranaikikkake`
- [ ] スクリーンショット撮影(各 iPhone サイズ)
- [ ] アプリ説明文・サブタイトル「会話がもっと楽しくなる」
- [ ] カテゴリ: **エンターテイメント**
- [ ] 年齢制限: 4+
- [ ] App Privacy(データ収集申告): 認証 ID は収集、画像は**収集しない**
- [ ] プライバシーポリシー URL 登録
- [ ] 審査メモ: 「占い表現はエンタメであることを画面・説明文で明示」を記載
- [ ] Sign in with Apple 提供を確認(Guideline 4.8)
- [ ] `eas submit --platform ios` で TestFlight 経由提出

## 受入基準

- Android: Google Play で公開され、シニア層でもインストール可能
- iOS(フェーズ 2): App Store で公開される

## 技術メモ

- Android 公開後の最初のレビューを必ず確認(シニア層から困惑コメントが来やすい)
- ストア説明文と実際のアプリ表記の整合性を取る(エンタメ表記を 3 箇所で揃える: オンボーディング・結果画面・ストア説明)
- Android 単独提出は Apple Sign In 不要(Guideline 4.8 は iOS のみ適用)
- **`docs/store/` 配下にコピペ用ドラフト一式**: アプリ説明・データセーフティ回答・コンテンツレーティング回答・レビュアーメモ・スクリーンショット手順・提出チェックリスト
- **データセーフティとプライバシーポリシーは内容を完全一致**させる(`legal/privacy.html` と `docs/store/data-safety-answers.md` を相互参照)
- 短い説明は **80 文字以内**、詳細な説明は 4000 文字以内
- データセーフティで「写真を収集する」と申告するが「保存しない」を明示する点が重要(送信即破棄)

## 次のアクション

1. **チケット 25(Google ログイン)を進める** → Google Cloud Console / SHA-1 / OAuth Client ID
2. **本番 Workers をデプロイ**(`wrangler deploy --env production`)
3. **`eas.json` の production env を本番 URL に差し替え**
4. **`eas build --profile production --platform android`** で AAB ビルド
5. **スクリーンショット撮影**([`store/screenshot-guide.md`](./store/screenshot-guide.md))
6. **Play Console アカウント開設**(初回 25 USD)
7. **ストア掲載情報を入力**(コピペで [`store/play-listing-draft.md`](./store/play-listing-draft.md))
8. **`eas submit --platform android`** で Internal Testing 提出
9. レビュー結果待ち → 段階リリース([`store/submission-checklist.md`](./store/submission-checklist.md))
