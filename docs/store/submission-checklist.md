# Play Store 提出チェックリスト

提出当日に頭から順に確認していくチェックリスト。

---

## 前提(コード側、25 完了で揃う)

- [ ] チケット 25(Google ログイン)完了
- [ ] Google Cloud Console で OAuth Client ID 取得(iOS/Android/Web)
- [ ] `eas credentials -p android` で SHA-1 取得 → Google Cloud Console に登録
- [ ] 本番 Workers デプロイ済み(`wrangler deploy --env production`)
- [ ] `eas.json` の `production.env.EXPO_PUBLIC_API_BASE_URL` を本番 Workers URL に変更
- [ ] `eas.json` の `production.env.EXPO_PUBLIC_GOOGLE_*_CLIENT_ID` 追加(or `eas secret:create` で機密管理)
- [ ] 本番ビルド成功(`eas build --profile production --platform android`)
- [ ] 実機で本番認証 + 全機能(charm / palm / match、音声、画像保存)動作確認

---

## Play Console アカウント

- [ ] Google Play Developer アカウント開設(初回 **25 USD**、クレジットカード必須)
- [ ] Console URL: https://play.google.com/console
- [ ] 開発者プロファイル入力(個人 or 会社、住所、税情報)

---

## アプリレコード作成

- [ ] アプリレコード作成
- [ ] パッケージ名: **`jp.hohoemi-rabo.uranaikikkake`**(変更不可なので注意)
- [ ] デフォルト言語: **日本語**
- [ ] アプリ / ゲーム: **アプリ**
- [ ] 無料 / 有料: **無料**

---

## ストア掲載情報

ドラフト: [`play-listing-draft.md`](./play-listing-draft.md) からコピー

- [ ] アプリ名: **占いキッカケ**
- [ ] 短い説明(80 文字以内)
- [ ] 詳細な説明(4000 文字以内)
- [ ] アプリアイコン 512×512(`assets/store/play-store-icon-512.png`)
- [ ] 機能グラフィック 1024×500(`assets/store/play-feature-graphic-1024x500.png`)
- [ ] スクリーンショット **2〜8 枚**(`assets/store/screenshots/`、25 完了後に撮影)
- [ ] カテゴリ: **エンターテイメント**
- [ ] タグ: 占い / 魅力発見 / 家族 / 会話 / シニア向け
- [ ] メール: **rabo.hohoemi@gmail.com**

---

## プライバシーポリシー

- [ ] URL: https://hohoemi-rabo.github.io/uranai-kikkake/legal/privacy.html
- [ ] HTTPS でアクセス可能(GitHub Pages が稼働しているか確認)

---

## データセーフティ

ドラフト: [`data-safety-answers.md`](./data-safety-answers.md) を参照

- [ ] ユーザー ID: 収集する、Google/Apple と共有、48 時間で削除
- [ ] 写真: 収集する、Gemini API と共有、保存しない、暗号化
- [ ] アプリ内操作: 収集する、共有なし、48 時間で削除
- [ ] HTTPS 暗号化: はい
- [ ] データ削除依頼: はい(メール経由)

---

## コンテンツレーティング

ドラフト: [`content-rating.md`](./content-rating.md) を参照

- [ ] カテゴリ: その他のアプリ
- [ ] 暴力・性・薬物・賭博: すべて「なし」
- [ ] 想定結果: **全年齢 / 3+**

---

## アプリのコンテンツ(その他)

- [ ] ターゲット年齢: **全年齢**
- [ ] 子供向けアプリ: **いいえ**
- [ ] **広告含む**: **いいえ**
- [ ] **アプリ内購入**: **なし**
- [ ] 政府関連アプリ: **いいえ**
- [ ] 金融商品: **いいえ**
- [ ] 健康関連: **いいえ**
- [ ] 新型コロナウイルス感染症関連: **いいえ**
- [ ] News アプリ: **いいえ**

---

## ストア提出

- [ ] AAB を `eas submit --platform android` でアップロード
  - 初回は EAS Connect で Play Console と連携(画面の指示通り認証情報をセット)
- [ ] **Internal Testing** トラックを選択
- [ ] テスター(自分や家族)のメールアドレスを追加
- [ ] **リリースノート(日本語)** を入力
  - 例:
    ```
    初回リリース
    ・AI による「魅力発見」「手相」「相性」診断
    ・1 日 3 回まで楽しめます
    ・音声読み上げ、画像保存に対応
    ```
- [ ] レビュー送信

---

## レビュアー向け

- [ ] [`review-notes.md`](./review-notes.md) を **「アプリのコンテンツ → 審査メモ」** または送信時の補足欄に添付
- [ ] テスト用 Google アカウントの提供が必要な場合は連絡先を記載

---

## 段階リリース

1. **Internal Testing**(現在地、即時可、最大 100 名)
2. **Closed Testing**(招待制、最大 100 グループ)
3. **Open Testing**(公開ベータ、誰でも参加可)
4. **Production**(本番リリース、世界中で公開)

ほほ笑みラボの生徒さん約 20 名で Internal → Closed テスト → 段階的に Open / Production へ。

---

## 後続作業

- [ ] レビュー結果メールを確認(通常 1〜3 日)
- [ ] 差し戻し時はメッセージを読んで該当箇所を修正 → 再提出
- [ ] 公開後、最初のレビュー / 評価を確認(シニア層から困惑コメントが来やすい)
- [ ] バグ報告対応、必要なら `eas build --profile production` で hotfix リリース
