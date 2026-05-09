# 24. ストア提出(Android 先行 / iOS はフェーズ 2)

> 関連: REQUIREMENTS.md §8

## 概要

フェーズ 1 では **Google Play への Android 提出のみ**。iOS App Store はフェーズ 2 に延期。

## 前提

- [21. ポリシーページ](./21-policy-pages.md)
- [23. EAS Build](./23-eas-build.md)
- [25. Google ログイン](./25-auth-google.md)

## TODO(フェーズ 1: Android)

- [ ] Play Console でアプリ作成、Package: `jp.hohoemi-rabo.uranaikikkake`
- [ ] 機能グラフィック(1024×500)登録
- [ ] スクリーンショット(電話 / タブレット)
- [ ] 短い説明(80 文字以内)、詳細な説明
- [ ] サブタイトル: 「会話がもっと楽しくなる」
- [ ] カテゴリ: **エンターテイメント**
- [ ] データセーフティフォーム: 顔画像の取扱を正直に申告(送信のみで保存しない)
- [ ] コンテンツレーティング: 全年齢
- [ ] プライバシーポリシー URL 登録
- [ ] `eas submit --platform android`
- [ ] Internal → Closed → Open Testing → Production の段階を踏む

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
