# 22. アイコン・スプラッシュ

> 関連: REQUIREMENTS.md §8.1.2, §8.2.2, §14

## 概要

アプリアイコンとスプラッシュ画面を作成し、Expo の `assets/images/` に配置する。

## 前提

- [01. プロジェクト基盤](./01-project-foundation.md)

## TODO

- [×] アイコン(1024×1024 PNG、角丸なし) → `assets/images/icon.png`
- [×] iOS 用は同じ icon.png(Expo が自動でリサイズ)
- [×] Android Adaptive Icon: foreground / background / monochrome の 3 枚
- [×] スプラッシュ画像(中央配置、200×200 程度の透過 PNG)→ `assets/images/splash-icon.png`
- [×] favicon(Web 用、48×48 PNG)→ `assets/images/favicon.png`
- [×] `app.config.ts` の `expo-splash-screen` plugin 設定: 既存設定が仕様通り(`imageWidth: 200`, `backgroundColor: '#F0F9FF'`)
- [×] ロゴ案: 「占キ」採用(charm/palm/match の 3 色グラデーション背景 + M PLUS Rounded 1c Black の白文字)
- [×] App Store 用 1024×1024 アイコン → `assets/store/app-store-icon-1024.png`(透過なし、flatten 済み)
- [×] Google Play 用 512×512 + 機能グラフィック 1024×500 → `assets/store/play-store-icon-512.png` / `play-feature-graphic-1024x500.png`

## 受入基準

- 実機ホーム画面でアイコンが正しく表示される
- 起動時にスプラッシュ → アプリ画面 がスムーズに切り替わる
- Adaptive Icon でマスクが正しく適用される

## 技術メモ

- iOS 用アイコンは透過 NG / 角丸 NG(Apple が自動で角丸処理) — `app-store-icon-1024.png` は `sharp.flatten({ background: '#FB7185' })` で alpha 平坦化済み
- Adaptive Icon の foreground は安全領域(中央 66%)に収める — `adaptive-foreground.svg` は font-size 360 で抑えてマスク切れ回避
- スプラッシュは「画像 1 枚 + 背景色」のシンプル構成。ローディングインジケータは入れない
- **SVG ソースは `assets/svg/` にコミット**。修正は SVG を編集して `npm run generate-icons` で再生成
- **生成スクリプト**: `scripts/generate-icons.mjs`(sharp + librsvg、密度 384 で高品質ラスタライズ)
- **フォント**: M PLUS Rounded 1c Black(アプリ本体と同一、`node_modules/@expo-google-fonts/m-plus-rounded-1c/` 由来)
- **WSL/Ubuntu セットアップ**(初回のみ): `cp node_modules/@expo-google-fonts/.../*.ttf ~/.fonts/ && fc-cache -f ~/.fonts`。`fonts-noto-cjk` apt install でも可だが sudo 不要なユーザー領域インストールの方が手軽
- ストア提出物は `assets/store/` 配下に分離(チケット 24 で App Store Connect / Play Console に提出)
- 後日プロデザイナーに差し替える場合は `assets/svg/*.svg` を上書き → `npm run generate-icons`、または PNG を直接上書き
