# 21. プライバシーポリシー / 利用規約 ページ

> 関連: REQUIREMENTS.md §8.3, §8.4, §14

## 概要

App Store / Google Play 提出に必須となるプライバシーポリシー・利用規約の Web ページを公開する。

## 前提

なし(アプリ提出前に完了している必要がある)

## TODO

- [×] ホスティング先決定 → **GitHub Pages**(リポジトリの `main` ブランチ `/` (root) 配信)
- [×] プライバシーポリシー本文作成(`legal/privacy.html`、REQUIREMENTS §8.3 の必須項目を網羅)
- [×] 利用規約本文作成(`legal/terms.html`、REQUIREMENTS §8.4 を網羅)
- [×] 公開 URL を `app/(main)/settings.tsx` の `PRIVACY_URL` / `TERMS_URL` に反映
- [ ] App Store Connect / Play Console に URL を登録 → **チケット 24(ストア提出)で対応**
- [ ] GitHub Pages を有効化する手動操作 → **ユーザーが GitHub.com 上で実施**

## 受入基準

- プライバシーポリシー URL に HTTPS でアクセスできる
- 利用規約 URL も同様
- 設定画面から実際に開ける

## 技術メモ

- **ホスティング**: GitHub Pages(`main` ブランチ / `/` root 配信)。URL: `https://hohoemi-rabo.github.io/uranai-kikkake/legal/*.html`
- **GitHub Pages 有効化手順**(ユーザーが 1 回手動):
  1. https://github.com/hohoemi-rabo/uranai-kikkake/settings/pages
  2. Source: **Deploy from a branch**
  3. Branch: **main** / Folder: **/ (root)**
  4. Save → 1〜2 分で公開
- **`.nojekyll`(リポ root)**: GH Pages デフォルトの Jekyll を無効化。React Native の `_layout.tsx` など underscore 始まりファイルが Jekyll の無視対象になるリスクを予防
- **更新方法**: `legal/*.html` を編集して `main` に push → GH Pages が自動再ビルド
- **改定日**: 各 HTML の `<p class="meta">` 内に明記。改定時は必ず更新(ストア審査向け)
- **設定画面の URL 定数**: `app/(main)/settings.tsx` の `PRIVACY_URL` / `TERMS_URL` の 2 箇所が単一の信頼ソース。アプリ内に他の参照箇所はない
- **public リポ前提**: GH Pages は public リポなら無料。private 化した場合は GitHub Pro 等が必要、もしくは別ホスティング(Vercel / hohoemi-rabo.com)に切替
- 顔画像の取扱を **正直に** 書く(ストア審査で食い違いがあると差し戻し) — 「サーバには一切保存しない、Gemini 送信後即破棄」を明記
- `<meta name="viewport">` で iOS の in-app WebBrowser でも読みやすくレスポンシブ化
