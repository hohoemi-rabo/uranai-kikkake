# 22. アイコン・スプラッシュ

> 関連: REQUIREMENTS.md §8.1.2, §8.2.2, §14

## 概要

アプリアイコンとスプラッシュ画面を作成し、Expo の `assets/images/` に配置する。

## 前提

- [01. プロジェクト基盤](./01-project-foundation.md)

## TODO

- [ ] アイコン(1024×1024 PNG、角丸なし) → `assets/images/icon.png`
- [ ] iOS 用は同じ icon.png(Expo が自動でリサイズ)
- [ ] Android Adaptive Icon: foreground / background / monochrome の 3 枚
- [ ] スプラッシュ画像(中央配置、200×200 程度の透過 PNG)→ `assets/images/splash-icon.png`
- [ ] favicon(Web 用、48×48 PNG)→ `assets/images/favicon.png`
- [ ] `app.config.ts` の `expo-splash-screen` plugin 設定: `imageWidth: 200`, `backgroundColor: '#F0F9FF'`(sky-50)
- [ ] ロゴ案: 「占キ」or 「🌟」or キャラクター(タロットカード風など)— ほほ笑みラボ系の温かみ
- [ ] App Store 用 1024×1024 アイコン(透過なし、角丸なし)
- [ ] Google Play 用 512×512 + 機能グラフィック 1024×500

## 受入基準

- 実機ホーム画面でアイコンが正しく表示される
- 起動時にスプラッシュ → アプリ画面 がスムーズに切り替わる
- Adaptive Icon でマスクが正しく適用される

## 技術メモ

- iOS 用アイコンは透過 NG / 角丸 NG(Apple が自動で角丸処理)
- Adaptive Icon の foreground は安全領域(中央 66%)に収める
- スプラッシュは「画像 1 枚 + 背景色」のシンプル構成。ローディングインジケータは入れない
