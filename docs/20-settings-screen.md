# 20. 設定画面

> 関連: REQUIREMENTS.md §5.5.1

## 概要

ログアウト・ポリシー閲覧・問い合わせ・オンボーディング再表示などを集約。

## 前提

- [03. オンボーディング](./03-onboarding.md)
- [06. 認証コンテキスト](./06-auth-context-securestore.md)
- [21. ポリシーページ](./21-policy-pages.md)

## TODO

- [×] `app/(main)/settings.tsx` 作成
- [×] アプリ情報(名前 / バージョン / ビルド番号)— `expo-constants` から取得(ビルド番号は EAS Build 後に意味を持つため現状はバージョンのみ表示)
- [×] 「利用規約」「プライバシーポリシー」リンク → `expo-web-browser` で開く
- [×] 「ログアウト」ボタン → `useAuth().signOut()` → (main)/_layout のガードでログイン画面に自動遷移
- [×] 「お問い合わせ」→ `Linking.openURL('mailto:...')`
- [×] 「はじめての方へ」→ AsyncStorage の `onboarding_completed` を削除 → `router.replace('/(auth)/onboarding')`
- [×] フェーズ 1.1 の履歴・お気に入り欄は本チケットに含めない(コメント化のみ)

## 受入基準

- ログアウトで認証状態が完全にクリアされる
- ポリシー / 利用規約が WebView で表示される
- 「はじめての方へ」を押すと再びオンボーディングが出る

## 技術メモ

- `expo-web-browser` の `openBrowserAsync` は SFSafariViewController / Custom Tabs を使うので体験が良い
- メールリンクは `mailto:rabo.hohoemi@gmail.com?subject=占いキッカケのお問い合わせ` のように subject を埋めると親切。日本語 subject は `encodeURIComponent` でエンコード
- **ポリシー URL は `hohoemi-rabo.com/uranai-kikkake/privacy` `/terms` のプレースホルダ**で埋め込み。チケット 21 で実 URL に差し替え予定。差し替え箇所は `app/(main)/settings.tsx` 冒頭の `PRIVACY_URL` / `TERMS_URL` 定数の **2 箇所のみ**
- **「はじめての方へ」を認証済みで通すため `(auth)/_layout.tsx` を変更**: `usePathname() === '/onboarding'` のみ whitelist。`/login` は引き続き認証済みなら `/(main)` にリダイレクト
- **onboarding 完了後の自動帰還**: onboarding.tsx は `router.replace('/(auth)/login')` で締めるが、認証済みなら (auth)/_layout のガードで /(main) に飛ばされるため、特別な分岐は不要
- **WebView ライブラリ(`react-native-webview`)は導入しない**: `expo-web-browser` の in-app ブラウザで十分。バンドルサイズが軽い
- **ログアウトと「はじめての方へ」は確認 Alert 必須**(シニア向け誤タップ事故防止)
- ホーム画面の「(開発用)ログアウト」(チケット 06 で仮置き)は本チケットで撤去済み
