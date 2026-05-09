# 20. 設定画面

> 関連: REQUIREMENTS.md §5.5.1

## 概要

ログアウト・ポリシー閲覧・問い合わせ・オンボーディング再表示などを集約。

## 前提

- [03. オンボーディング](./03-onboarding.md)
- [06. 認証コンテキスト](./06-auth-context-securestore.md)
- [21. ポリシーページ](./21-policy-pages.md)

## TODO

- [ ] `app/(main)/settings.tsx` 作成
- [ ] アプリ情報(名前 / バージョン / ビルド番号)— `expo-constants` から取得
- [ ] 「利用規約」「プライバシーポリシー」リンク → `expo-web-browser` で開く
- [ ] 「ログアウト」ボタン → `useAuth().signOut()` → ログイン画面
- [ ] 「お問い合わせ」→ `Linking.openURL('mailto:...')`
- [ ] 「はじめての方へ」→ AsyncStorage の `onboarding_completed` を削除 → オンボーディングへ
- [ ] フェーズ 1.1 の履歴・お気に入り欄は本チケットに含めない(コメント化のみ)

## 受入基準

- ログアウトで認証状態が完全にクリアされる
- ポリシー / 利用規約が WebView で表示される
- 「はじめての方へ」を押すと再びオンボーディングが出る

## 技術メモ

- `expo-web-browser` の `openBrowserAsync` は SFSafariViewController / Custom Tabs を使うので体験が良い
- メールリンクは `mailto:rabo.hohoemi@gmail.com?subject=占いキッカケのお問い合わせ` のように subject を埋めると親切
