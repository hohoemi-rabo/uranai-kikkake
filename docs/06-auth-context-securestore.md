# 06. 認証コンテキスト / SecureStore

> 関連: REQUIREMENTS.md §4.1.2, §4.1.3, §12.2 / CLAUDE.md「expo-secure-store」

## 概要

ID トークンを `expo-secure-store` に保存し、アプリ全体で参照できる認証コンテキストを作る。フェーズ 1 ではスタブ認証(04)で動かし、後で Google(25)に差し替えできる構造にする。

## 前提

- [04. スタブ認証](./04-auth-stub-dev.md)

## TODO

- [ ] `src/hooks/useAuth.ts` を作成(`{ idToken, provider, sub, signIn, signOut, isAuthenticated }`)
- [ ] `signIn(provider)` は `provider` 引数で分岐:
  - `'stub'`(デフォルト): 04 の `signInStub` を呼ぶ
  - `'google'`: チケット 25 で実装(現状はプレースホルダーで OK)
  - `'apple'`: フェーズ 2(05)で実装
- [ ] `expo-secure-store` の `setItemAsync` / `getItemAsync` / `deleteItemAsync` をラップ
- [ ] 起動時に SecureStore からトークンを復元 → ローディング状態を経て `isAuthenticated` を確定
- [ ] `app/_layout.tsx` で AuthProvider をルートにマウント
- [ ] `app/(auth)/_layout.tsx`: 認証済みなら `/(main)` に Redirect
- [ ] `app/(main)/_layout.tsx`: 未認証なら `/(auth)/login` に Redirect
- [ ] ログアウト: SecureStore クリア + `/(auth)/login` へ
- [ ] フェーズ 1 では IDトークン期限切れ → 強制再ログイン(リフレッシュトークン処理は省略)
- [ ] API リクエストの 401 で自動ログアウトするユーティリティを `src/lib/api.ts` に置く

## 受入基準

- スタブログイン後、アプリ再起動でも認証状態が維持される
- ログアウトで次回起動時にログイン画面に戻る
- API リクエストで 401 が返ったら自動的にログアウト+ログイン画面遷移
- `provider` の差し替えがチケット 25 で 1 関数の置換だけで済む構造になっている

## 技術メモ

- `SecureStore` のキーは `idToken`、`provider`、`sub` の 3 つ
- `provider` は API リクエストの payload と Workers の検証分岐に使う
- `useAuth` は Context でグローバル提供。`useState` を画面ごとに持たない
- スタブモード時は SecureStore を使わず AsyncStorage に置く選択肢もあるが、**製品コードを揃えておく**ため SecureStore で統一するのを推奨
