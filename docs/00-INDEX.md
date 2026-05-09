# 開発チケット一覧

REQUIREMENTS.md の §11 ロードマップを実装単位に分割したもの。番号はチケット ID であり、必ずしも着手順ではない(依存関係はチケット内の「前提」を参照)。

## TODO 記法

各チケット内のチェックリストは:

- `- [ ]` 未着手
- `- [×]` 完了(進行中も `- [ ]` のまま、完了時に `×` を入れる)

## 着手順の目安(フェーズ 1)

`expo start --tunnel`(Expo Go)で開発するため、ネイティブ Google / Apple SDK の導入は最後に回す。

```
01 → 02 → 22 → 03 → 04(stub auth) → 06 → 07 → 08 → 09 → 19 → 10
   → 11 → 12 → 13 → 14 → 15 → 16 → 17 → 18 → 20 → 21
   → 25(本番 Google ログイン)→ 23 → 24(Android 提出)
```

## チケット

### 基盤
- [01. プロジェクト基盤](./01-project-foundation.md) — NativeWind / フォント / テーマ / `app.config.ts`
- [02. 権限プラグイン設定](./02-permissions-plugins.md)
- [22. アイコン・スプラッシュ](./22-assets-icon-splash.md)

### オンボーディング・スタブ認証(Expo Go で開発できる範囲)
- [03. オンボーディング](./03-onboarding.md)
- [04. スタブ認証(開発用)](./04-auth-stub-dev.md)
- [06. 認証コンテキスト / SecureStore](./06-auth-context-securestore.md)

### バックエンド(Cloudflare Workers)
- [07. Workers ブートストラップ](./07-workers-bootstrap.md)
- [08. ID トークン検証(stub + Google + Apple 雛形)](./08-workers-token-verify.md)
- [09. KV 利用回数管理](./09-workers-rate-limit-kv.md)
- [10. Gemini 連携](./10-workers-gemini.md)
- [19. プロンプト(charm/palm/match)](./19-prompts.md)

### 画面・機能
- [11. ホーム画面](./11-home-screen.md)
- [12. カメラ画面](./12-camera-screen.md)
- [13. 写真選択](./13-image-picker.md)
- [14. 画像処理(リサイズ/JPEG/base64)](./14-image-processing.md)
- [15. プレビュー画面](./15-preview-screen.md)
- [16. 結果画面](./16-result-screen.md)
- [17. 音声読み上げ](./17-speech.md)
- [18. 結果画像のカメラロール保存](./18-save-result-image.md)
- [20. 設定画面](./20-settings-screen.md)

### 提出準備(フェーズ 1 末尾)
- [21. プライバシーポリシー / 利用規約 ページ](./21-policy-pages.md)
- [25. Google ログイン(本番)](./25-auth-google.md) — Expo Go が使えなくなるためフェーズ 1 の最後に
- [23. EAS Build 設定](./23-eas-build.md)
- [24. ストア提出(Android 先行)](./24-store-submission.md)

### フェーズ 2(保留)
- [05. Apple ログイン(フェーズ 2)](./05-auth-apple-phase2.md)
- 24 内の iOS 提出 TODO
