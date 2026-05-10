# 01. プロジェクト基盤

> 関連: REQUIREMENTS.md §2.1, §5.1, §5.2 / `app.json`

## 概要

Expo スターターを「占いキッカケ」用の基盤に入れ替える。NativeWind v4 を導入し、M PLUS Rounded 1c フォントを読み込み、タブごとのアクセントカラーを定義し、`app.config.ts` で dev/prod のバンドル ID を分岐できるようにする。

## 前提

なし(最初に着手するチケット)

## TODO

- [×] NativeWind v4 + Tailwind CSS のセットアップ(`tailwind.config.js`, `metro.config.js`, `babel.config.js`, `global.css`)
- [×] `tailwind.config.js` でタブカラー(rose-400 / teal-400 / orange-400)とベース sky-50 を `theme.extend.colors` に登録
- [×] `expo-font` で M PLUS Rounded 1c(400/700/900)を読み込み、`SplashScreen.preventAutoHideAsync` でフォント読み込み完了まで待機
- [×] `constants/theme.ts` を REQUIREMENTS §5.1 のカラーシステムに置換(ダークモード関連を削除)
- [×] `app.json` を `app.config.ts` に置換し、`APP_ENV` で `name` / `bundleIdentifier` / `package` を分岐
- [×] バンドル ID `jp.hohoemi-rabo.uranaikikkake` / dev は `.dev` サフィックス
- [×] `app/_layout.tsx` から `DarkTheme` 切り替えを撤去し、固定の light テーマに変更
- [×] スターターのサンプル画面(`(tabs)/explore.tsx`、`modal.tsx`、サンプルコンポーネント)を削除

## 受入基準

- `npm run ios` / `npm run android` 起動時に sky-50 背景の空画面が出る(ダークモードで色が変わらない)
- `tailwind` クラスでアクセントカラーが利用できる(例: `bg-charm`, `bg-palm`, `bg-match` など)
- `APP_ENV=production npm start` と無指定で別アプリとして共存インストール可能

## 技術メモ

- NativeWind v4 は Metro 設定が必須(`withNativeWind`)。v3 とは API が違うので注意
- M PLUS Rounded 1c は Google Fonts の `@expo-google-fonts/m-plus-rounded-1c` パッケージが楽
- `app.config.ts` を作ったら `app.json` は削除する(両方あるとエラー)
