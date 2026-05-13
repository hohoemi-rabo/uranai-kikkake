# app/CLAUDE.md

`app/` 配下(Expo Router、画面、UI コンポーネント)で作業するときのガイド。

## ルーティング(Expo Router v6)

- `app/_layout.tsx` がルート Stack。`(tabs)` グループと `modal` を持つ。
- 認証ガードは `app/(auth)/` と `app/(main)/` のグループ分割で実装(REQUIREMENTS §4.1, §5.5)。
- `app.config.ts` で `experiments.typedRoutes: true` を有効化済み。新しいルートを追加したら一度 dev server を回して `.expo/types` を再生成。
- `scheme: "uranaikikkake"` がディープリンク用。
- 画面遷移は `router.push` / `router.replace` を使い分ける(履歴に残すか否か)。プレビュー → 結果は `replace` 推奨。

### 認証ガードのパターン

```tsx
// app/(auth)/_layout.tsx
if (isAuthenticated) return <Redirect href="/(main)" />;

// app/(main)/_layout.tsx
if (!isAuthenticated) return <Redirect href="/(auth)/login" />;
```

`typedRoutes: true` 有効時は `href` も型チェックされる。

## React Compiler 有効下のコーディング

`app.config.ts` で `experiments.reactCompiler: true`。

- **`useMemo` / `useCallback` / `React.memo` は書かない**。コンパイラが自動で最適化する。書いてあるとコンパイラが介入を諦めるケースがある。
- ただし `useEffect` の依存配列など副作用のあるフックは従来通り正しく書く。
- 条件付きフック呼び出しなどは引き続き禁止(Rules of React)。

## NativeWind v4 とテーマ

- Tailwind 文法でスタイル指定。Web 版資産を流用しやすい。
- アクセントカラーは `tailwind.config.js` の `theme.extend.colors` に `charm` / `palm` / `match` を定義する。
- ベース背景は `bg-sky-50`、カードは `bg-white` か `bg-slate-50`、開運アイテムは `bg-amber-50`、アドバイスは `bg-emerald-50`(REQUIREMENTS §5.1.1)。

### タブごとのアクセントカラー

| タブ | アクセント | クラス例 |
|------|----------|--------|
| 🌟 魅力発見 | コーラルピンク `rose-400` | `bg-rose-400`、`border-rose-400` |
| ✋ 手相 | ティール `teal-400` | `bg-teal-400`、`border-teal-400` |
| 💖 相性 | オレンジ `orange-400` | `bg-orange-400`、`border-orange-400` |

タブ選択時に連動する要素: 撮影フレームの枠線・カメラ起動ボタン・「占ってみる」ボタン背景・結果見出し・カード左ボーダー・ヒントテキストの点滅(REQUIREMENTS §5.1.2)。

## フォント

- **M PLUS Rounded 1c**(400/700/900)を `expo-font` で読み込み。
- `SplashScreen.preventAutoHideAsync()` でフォント読み込み完了まで待機。
- 直接 `fontFamily` を当てるか、`tailwind.config.js` の `fontFamily.rounded` 経由で。

## シニア配慮 UI(必須)

- ボタンは最低 `p-5` `text-lg` 以上
- 明るくコントラストの高い色 — **ダークモードは採用しない**
- 平易な日本語(「カメラを切り替える」「ここに顔を合わせてね」)
- 絵文字+文字で視覚的に伝える
- 通知許可リクエストはしない(ほほ笑みラボ方針)
- ローディング時は控えめなスピナー(派手なアニメ NG)

## ライブラリ別パターン

### expo-camera

`useCameraPermissions` フックで 3 状態(loading / not granted / granted)を必ずハンドル。`Camera.requestCameraPermissionsAsync()` 直叩きはしない。

```tsx
import { CameraView, useCameraPermissions } from 'expo-camera';
const [permission, requestPermission] = useCameraPermissions();
if (!permission) return null; // loading
if (!permission.granted) return <RequestPermissionUI onPress={requestPermission} />;
return <CameraView facing={facing} />;
```

iOS シミュレータでは動作しない。**実機テスト必須**。

### expo-image-picker / expo-image-manipulator

- 画像選択は `launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 })`(リサイズは送信前にまとめて)
- HEIC は `expo-image-manipulator` の自動変換で JPG になるため専用ライブラリ不要
- API 送信前は **長辺 1024px / quality 0.8 / JPEG / base64**(REQUIREMENTS §4.3.2)
- `data:image/jpeg;base64,` プレフィックスは含めない(Workers が直接 Gemini に渡す)

### expo-secure-store

ID トークン保管に必ず使う。`AsyncStorage` ではない。iOS は Keychain、Android は EncryptedSharedPreferences。

```tsx
await SecureStore.setItemAsync('idToken', token);
const token = await SecureStore.getItemAsync('idToken');
```

`AsyncStorage` はオンボーディング完了フラグなど非機密データ専用。

### expo-speech

- `language: 'ja-JP'`、`rate: 1.0`、`pitch: 1.0`(REQUIREMENTS §4.5.1)
- 画面アンマウント時に `Speech.stop()` を `useEffect` cleanup で必ず呼ぶ
- 再生中状態はローカル `useState` でトラック(`isSpeakingAsync` は遅延あり)
- 長文は句点で分割して `speak` を複数回呼ぶ方が安定

### react-native-view-shot + expo-media-library

結果カードを画像化してカメラロールに保存(REQUIREMENTS §4.5.2):
- `captureRef` はレンダリング完了後に呼ぶ
- 画像サイズは 1080px 幅固定
- 保存前に `MediaLibrary.requestPermissionsAsync()`
- iOS の Limited Photos モードでも `saveToLibraryAsync` は動く

## Config Plugins(`app.config.ts` で集約)

権限文言は `Info.plist` 直接編集ではなく **plugin 設定**で管理する。文言変更は **JS リロードでは反映されない** → `npx expo prebuild --clean` + ネイティブビルド。

```jsonc
plugins: [
  "expo-router",
  ["expo-camera", { "cameraPermission": "...", "microphonePermission": false, "recordAudioAndroid": false }],
  ["expo-image-picker", { "photosPermission": "...", "cameraPermission": "...", "microphonePermission": false }],
  ["expo-media-library", { "photosPermission": "...", "savePhotosPermission": "..." }]
]
```

## New Architecture

`newArchEnabled: true`。ネイティブモジュールの追加・削除や plugin 設定の変更時は:

```bash
npx expo prebuild --clean
npx expo run:ios   # or run:android
```

Expo Go では再現できないクラッシュは New Arch 互換性が原因のことが多い。

## デバッグ Tips

- iOS シミュレータでは: Apple Sign In・カメラが動かない → 実機テスト
- Android エミュレータ: ホスト PC のカメラを使う設定で動作確認可能
- HEIC: ネイティブカメラ経由では発生しない(Expo が自動 JPG)
- フォント未ロードのまま画面が出る場合は SplashScreen の `preventAutoHideAsync` を確認

## チケット 01 完了時の知見

- **NativeWind v4 + Tailwind CSS のバージョン**: `tailwindcss@^3.4` を明示的に dev dependency に入れる(NativeWind v4 は Tailwind v3 系前提。v4 系を入れるとビルドエラー)。
- **`babel.config.js` は `nativewind/babel` を `presets` 側に**: `presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel']` の形に統一。`plugins` 側に書いたり混在させると warning や className 未反映が起きる。
- **Google Fonts のキー名は 3 箇所完全一致が必須**: `@expo-google-fonts/m-plus-rounded-1c` の export 名 `MPLUSRounded1c_400Regular` を、(a) `useFonts({ MPLUSRounded1c_400Regular })` のキー、(b) `tailwind.config.js` の `fontFamily.rounded: ['MPLUSRounded1c_400Regular']` の配列要素、(c) `constants/theme.ts` の `Fonts.rounded` 値 — のすべてで一字一句揃える。1 箇所違うとフォントが当たらない。
- **`app.config.ts` と `app.json` は両立不可**: 置換時に旧 `app.json` を必ず削除。両方残すと `expo` がエラーで起動しない。
- **dev/prod の分岐は `process.env.APP_ENV`**: `__DEV__` だと EAS Build の preview/production を区別できない。`app.config.ts` 内で `process.env.APP_ENV === 'production'` を判定し、`bundleIdentifier` / `package` / `name` を切り替える。`expo config --type public` / `APP_ENV=production expo config --type public` で出力差分を確認。
- **画面遷移時の白フラッシュ防止**: `Stack.screenOptions.contentStyle.backgroundColor` と `SystemUI.setBackgroundColorAsync(...)` の **両方**を背景色(sky-50)で揃える。片方だけだとネイティブ層 or React Navigation 層のどちらかで白がチラつく。
- **`expo lint` は `app components hooks` を見に行く**: `components/` や `hooks/` を削除して空にしたまま放置すると `No files matching the pattern "components"` で lint が落ちる。**空ディレクトリは残さず削除**(必要になったチケットで `mkdir` から始める)。空ディレクトリを残したい場合は `.gitkeep` ではなくダミーの `.ts`/`.tsx` を入れる必要がある。

## チケット 02 完了時の知見

- **権限文言の確認は `npx expo config --type introspect`**: `prebuild --clean` を走らせると `ios/`/`android/` が生成されて Expo Go フローが壊れる。フェーズ 1 のうちは introspect 出力で `mods.ios.infoPlist` と `mods.android.manifest` を grep するだけで十分。`prebuild` の初実行はチケット 23 (EAS Build) まで遅延。
- **同じ Purpose String を要求する複数 plugin は文言を完全一致**: `expo-camera.cameraPermission` と `expo-image-picker.cameraPermission` はどちらも `NSCameraUsageDescription` に書き込まれる。文言が違うと後勝ちで上書きされ警告も出ない。**コピペ前提**で揃える。
- **`NSPhotoLibraryAddUsageDescription` は読込権限と独立**: `expo-media-library.savePhotosPermission` が `NSPhotoLibraryAddUsageDescription`(iOS 14+ で保存専用)、`photosPermission` が `NSPhotoLibraryUsageDescription`(読込)。両方設定しないとストア審査で落ちる。`expo-image-picker.photosPermission` は読込側に重複(これも文言一致必須)。
- **マイク不要なアプリは 3 箇所で false**: `expo-camera` の `microphonePermission: false` + `recordAudioAndroid: false`、`expo-image-picker` の `microphonePermission: false`。`expo-camera` の `recordAudioAndroid: false` を入れないと Android で `RECORD_AUDIO` が manifest に残る(introspect では `tools:node='remove'` 付きで出るので、`tools:node` の有無まで確認すること)。
- **`isAccessMediaLocationEnabled: false` で GPS メタデータ権限を抑止**: `expo-media-library` のデフォルトは true で、true だと `ACCESS_MEDIA_LOCATION` が要求される(写真の Exif GPS 読み取り)。占いには不要なので明示的に false。シニア向けアプリの権限ダイアログ数を減らせる。
- **Apple plugin はフェーズ 2 まで入れない**: `expo-apple-authentication` の plugin を入れると Expo Go で動かなくなる。チケット 02 の文面 TODO に Apple plugin 行があるが、05 と同時にフェーズ 2 で導入する運用にずらしてある(`docs/02-permissions-plugins.md` 参照)。

## チケット 03 完了時の知見

- **`GestureHandlerRootView` で root をラップする**: `app/_layout.tsx` の Stack を `GestureHandlerRootView style={{ flex: 1 }}` で包まないと、`Gesture.Pan()` 等のジェスチャーが何も反応しない(無音で失敗)。expo-router は自動ラップしてくれない。
- **AsyncStorage キーの単一の信頼ソース**: `lib/onboarding.ts` 内の `KEY = 'onboarding_completed'` のみ参照。`AsyncStorage.getItem('onboarding_completed')` のような直接リテラルを散らさない(タイポで永続的にオンボーディングが出続ける事故を防ぐ)。
- **`_layout.tsx` の splash 隠蔽は複数の非同期完了を全て待つ**: フォント `useFonts` の `loaded` と AsyncStorage 状態 `onboardingDone !== null` の **両方完了**してから `SplashScreen.hideAsync()`。片方だけで render すると、未完了オンボーディングが必要なケースでホーム画面が一瞬出てしまう。
- **Reanimated worklet → JS 関数呼び出しは `runOnJS`**: `Gesture.Pan().onEnd` 内は worklet 文脈なので、`setIndex` 等の React state 関数を直接呼べない。`runOnJS(goTo)(next)` でラップ。
- **`Stack.Screen options.gestureEnabled: false`** でスワイプバック禁止。オンボーディングのような「絶対に途中で抜けてほしくない画面」では必須(シニア向け事故防止)。
- **AsyncStorage の boolean 永続化は文字列 `'true'` で十分**: `JSON.stringify(true)` も `'true'` を返すが、シンプルさのため文字列リテラル直書きで OK。`null` チェックで未設定判定。
- **スライド画面の幅は `Dimensions.get('window').width` でモジュールトップで取得**: 画面回転には対応しない(`orientation: 'portrait'` 固定の `app.config.ts`)。回転対応が必要なら `useWindowDimensions` に切替。

## チケット 04 完了時の知見

- **`expo-router` の groups は URL に出ない**: `app/(auth)/login.tsx` の URL は `/login`。typedRoutes 有効時は `'/(auth)/login'` の形でも `'/login'` の形でも書けるが、グループ間遷移を明示したいときは `'/(auth)/login'` 推奨(将来 `(main)/login.tsx` のような同名衝突を防げる)。
- **`Stack.Screen` の重複登録は子に集約**: `app/_layout.tsx` で `<Stack.Screen name="onboarding" />` を書いて、`(auth)/_layout.tsx` で同じ名前の Screen を再宣言すると二重管理になる。**子グループに置いた Screen は親 Stack で再宣言しない**。親では `<Stack.Screen name="(auth)" />` のように **グループ名そのもの**だけ登録する。
- **`expo-crypto.randomUUID()` は同期 API**: `await` 不要。AsyncStorage 操作は async なので関数全体は async になる。
- **`process.env.EXPO_PUBLIC_*` の未設定フォールバック**: Metro はビルド時に `EXPO_PUBLIC_*` をバンドルへ展開するが、`.env` 未配置時は `undefined`。`?? 'stub'` で安全にフォールバックすれば `.env` ファイル無しでも動作。
- **stub 認証は SecureStore を使わない**: 04 段階ではトークンを永続化しない(セッションを覚えるのは 06 の `useAuth` の責務)。リロードするとログイン画面に戻るが、これは 06 で SecureStore 復元が入って解消される。
- **`git mv` 直後のファイルは Edit ツールで触る前に Read が必要**: 移動先パスが新規 path 扱いになるため。`git mv app/onboarding.tsx app/(auth)/onboarding.tsx` 後に Edit したい場合は、移動先パスを Read してから Edit。
- **`signIn(provider?)` のデフォルト引数は `EXPO_PUBLIC_AUTH_MODE`**: 呼び出し側は `signIn()` で OK(モード判定をモジュール内に閉じ込める)。プロバイダごと明示的に呼びたい場合は `signIn('google')` のように引数指定。25 で `signInGoogle()` を分岐に追加するだけで切替完了。

## チケット 06 完了時の知見

- **`(auth)`/`(main)` 双方向ガードの落とし穴**: 両 layout で `useAuth().isAuthenticated` を見るが、**両方とも `isLoading` 中は `null` を返す**こと。片方だけにすると SecureStore 復元中に一瞬「未認証」と判定され、ログイン → ホーム遷移時に画面がチラつく。root の splash 隠蔽でも `authLoading` を待つので二重防御になっている。
- **`AuthProvider` は root layout 関数の中で `useAuth()` を呼べない**: 同じ関数スコープに `<AuthProvider>` と `useAuth()` を書くと「`AuthContext` is null」エラー。**内部コンポーネント(`RootContent`)に切り出して、それを `<AuthProvider>` でラップ**するパターンが必須。root layout のデフォルトエクスポートは `<AuthProvider><RootContent /></AuthProvider>` だけにする。
- **React Compiler 下で `useCallback` を書かない**: `useAuth` 内の `signIn` / `signOut` を素の関数として定義(コンパイラが最適化する)。`registerOn401(signOut)` を呼ぶ `useEffect` の依存配列は **空 `[]` で OK**(モジュールスコープのシングルトン書き換えなので、毎回新しい関数参照でも問題なし)。
- **SecureStore 3 キー一括 read で 1 つでも欠けたら `null`**: `loadSession` が `idToken`/`provider`/`sub` のいずれかを欠いたら **`null` を返して強制再ログイン**。部分復元(壊れたセッションのまま継続)は事故のもとなのでやらない。
- **401 自動ログアウトはモジュールスコープのハンドラ登録**: `lib/api.ts` 内で `let on401Handler` を持ち、`AuthProvider` が `useEffect` で `registerOn401(signOut)` する。`lib/` 側から `hooks/` を import しないので **依存方向が一方向**になり循環しない。Context 経由で fetch ラッパーを取り回すよりシンプル。
- **`(tabs)` → `(main)` リネームは 3 箇所同時更新**: ディレクトリ名・`unstable_settings.anchor`・`<Stack.Screen name>`。1 箇所でも `(tabs)` のまま残るとホットリロード後にホーム画面が出なくなる(`unstable_settings.anchor` のミスマッチが特に発見しにくい)。
- **stub セッションも SecureStore に永続化**: 04 では「リロードでログイン画面に戻る」が想定内だったが、06 完了後は `idToken`/`provider`/`sub` が SecureStore に乗るので、**端末のアプリデータを削除しない限り認証維持**。テスト時は Android 設定 → アプリ情報 → ストレージ → **データを削除**(キャッシュ削除では SecureStore は消えない)。
- **`expo-secure-store` plugin の登録忘れに注意**: `npx expo install` は `app.config.ts`(動的設定)に自動追記できず、コンソールに「Add the following to your Expo config」と表示される。`plugins` 配列に `'expo-secure-store'` を **手動追記**しないと、ネイティブビルド時(チケット 23 以降)に動かない。Expo Go では未登録でも動くため気付きにくい。
- **動作確認用のログアウトボタンはホーム画面に仮置き → チケット 20 完了で撤去済み**: 設定画面(`app/(main)/settings.tsx`)からログアウト可能になったため、ホームの暫定ボタンは削除済み。今後はチケット 20 完了知見も合わせて参照。

## チケット 11 完了時の知見

- **NativeWind は文字列補間でクラスを生成できない**: `` `bg-${tab}` `` のような書き方は Tailwind の purge で消える。`Record<TabKey, string>` のルックアップテーブル(例: `TAB_BG = { charm: 'bg-charm', ... }`)でクラス文字列を明示する
- **実行時に決まる動的な色は `style` プロパティ**: `TabAccent[tab]` のような値は className に乗せられない。`style={{ color: TabAccent[tab] }}` を併用するか、Reanimated の場合は `[{ color: ... }, animStyle]` の配列で渡す
- **Expo Router の `<Tabs>` はボトムタブバー専用**: ホーム画面内のモード切替に使うとボトムバーが二重に出る。モード切替は自前の `TabSwitcher` コンポーネント + 親レイアウトは `<Stack>` にする
- **`<Stack>` の子画面は file-based 自動認識**: `<Stack.Screen>` を列挙しなくても `app/(main)/foo.tsx` を作れば追加される。`gestureEnabled: false` などのオプションを付けたいときだけ明示的に `<Stack.Screen>` を書く
- **`UsageProvider` の JST 日付ミスマッチ判定**: AsyncStorage キャッシュの `dateJst` が今日(JST)と違ったら `null` を `setUsage` → `remaining = DEFAULT_MAX`。日跨ぎ後に「残り 0」が引きずられない仕組み
- **Reanimated の `withRepeat(..., -1, true)`**: 第 2 引数 `-1` = 無限、第 3 引数 `true` = リバース(往復)。`withTiming(0.35, ...)` のように最低 opacity を 0 ではなく 0.35 にすると控えめな点滅になりシニア配慮的(§5.4)
- **ルート `tsconfig.json` から `workers/` を `exclude`**: ルートに `@cloudflare/workers-types` が無いため、`KVNamespace` 等を参照する `workers/src/*.ts` を root tsconfig が拾うと `npx tsc --noEmit` が落ちる。`"exclude": ["node_modules", "workers", ".expo"]` で除外する
- **`Array<T>` ではなく `T[]` 表記**: `eslint-config-expo` の `@typescript-eslint/array-type` ルールで警告される。配列リテラル型は `{ ... }[]` を使う
- **`useUsage().updateUsage(next)` は将来の divine 呼び出しで呼ぶ**: 11 単体では `updateUsage` の呼び出し元が無いが、16(結果画面)で API レスポンス `usage` をそのまま渡す前提。Context 経由なのでホーム再表示時に自動反映される

## チケット 12 完了時の知見

- **`CameraView` の子要素はカメラビューに重ねて描画される**: `<CameraView>` の children に `<SafeAreaView>` や絶対配置の overlay を入れれば自動でカメラ映像の上にレンダリングされる。Web の `<canvas>` のような特殊扱いではなく、普通の View ヒエラルキー
- **装飾用 overlay は `pointerEvents="none"` 必須**: フレーム枠用の View がシャッターボタンを覆ってしまう設計だと、ボタンが押せない事故が起きる。フレーム等の **装飾的な View** は必ず `pointerEvents="none"`(または `style={{ pointerEvents: 'none' }}`)で透過
- **`useCameraPermissions` の 3 状態は必ず分岐**: `permission === null`(loading で黒画面)/ `!permission.granted`(未許可、説明 UI + リクエスト + 戻る)/ `permission.granted`(カメラ表示)。loading のときに UI を出すと「ちらつき」が発生する
- **`permission.canAskAgain === false` で OS 設定に誘導**: 2 回拒否すると OS 側でこのフラグが false になる。**この場合のみ**「設定アプリで許可する」リンクを表示し、`Linking.openSettings()` で OS の許可画面に飛ばす
- **`Linking.openSettings()` は `react-native` 標準 export**: `expo-linking` ではない方の `Linking`。`expo-linking` は deep link 用で別物
- **`takePictureAsync` の戻り値は `null` の可能性**: 型上は `Promise<CameraCapturedPicture | undefined>` だが、Android 実機で稀に `null` が返ることがある。**`if (!photo) throw new Error(...)` でガード**
- **`facing` 初期値はモード依存**: charm(セルフィー)は `'front'`、palm/match は `'back'`。`useState<CameraType>(mode === 'charm' ? 'front' : 'back')` で初期化(モードが変わって遷移し直すと再マウントで再評価される)
- **`StatusBar style="light"` を画面ローカルで設定**: カメラ画面は黒背景なので白アイコンが必要だが、`(main)` の他画面は `dark` のまま。`<StatusBar />` を画面コンポーネント内に書くと **その画面のときだけ** 設定が効く(expo-router がスタックする)
- **シャッターは `disabled` + state フラグで連打防止**: `setCapturing(true)` → `try / finally` で必ず `false` に戻す。連打されると photo URI のレースで挙動が不定になる。連打中はシャッター内側の色を `slate` にして視覚的にフィードバック
- **撮影完了後の遷移先はチケット 15 で本物に置換**: 現状は `Alert.alert(URI)` でスタブ。`// チケット 15 でプレビュー画面遷移に差し替え` というコメントを残して、15 着手時に grep で見つけて剥がす
- **`router.push({ pathname, params })` 形式で型安全に遷移**: クエリ文字列を手で組み立てると typo の温床。`params` オブジェクトで渡すと、受け取り側で `useLocalSearchParams<{ mode?: string }>()` が型ヒント付きで取れる(ただし optional + string 限定なので、union 型は受け取り側で `isTabKey` のような型ガード関数で narrow する)

## チケット 13 完了時の知見

- **`mediaTypes` は配列形式が SDK 54 の正**: `MediaTypeOptions.Images` は deprecated。`['images']`(複数選択許可なら `['images', 'videos']`)
- **`requestMediaLibraryPermissionsAsync` は granted 時に再プロンプトしない**: 取得済みなら即 `{ granted: true }` を返すので、毎呼び出し OK。`getMediaLibraryPermissionsAsync` を先に呼んで状態確認する必要は薄い(コード行数だけ増える)
- **iOS 14+ Limited Photos でも `launchImageLibraryAsync` は動く**: `accessPrivileges === 'limited'` の状態でも、ユーザーが選択した写真サブセットだけからピッカーが立ち上がる。コード側で特別なハンドリング不要
- **HEIC は picker ではそのまま渡る**: `expo-image-picker` 自体は HEIC を JPG に変換しない。送信前に `expo-image-manipulator` で `manipulate` すると、フォーマットを `JPEG` 指定するだけで自動変換される(チケット 14 のスコープ)
- **`canAskAgain === false` の挙動 Android / iOS 差**: Android は 2 回拒否で false、iOS は「2 度と聞かない」を選ぶと即 false。両方とも「設定アプリで許可する」誘導が必要なので、`canAskAgain === false` 判定で `Linking.openSettings()` Alert を出す
- **`selectionLimit: 1` は明示推奨**: デフォルトは 1 だが、将来複数選択に拡張する可能性に備えて型を明確にしておくと変更時の確認漏れが減る
- **picker 開いている間は OS が modal で覆う**: アプリ側に spinner や進捗表示は不要。連打防止だけ `picking` フラグで処理(カメラの `capturing` パターンと同じ)
- **`Linking.openSettings()` Alert 構造**: `[{ text: 'キャンセル', style: 'cancel' }, { text: '設定を開く', onPress: () => Linking.openSettings() }]`。カメラ画面の denied 画面と同じ意図だが、ホームから一発で呼ぶケースは Alert が軽く UI 圧迫しない
- **`result.canceled` と `result.assets[0]` の両方ガード**: `result.canceled === true` だと `assets` は無い型だが、`canceled === false` でも asset 配列が空な事故ケースをカバーするため両方 falsy ガード

## チケット 14 完了時の知見

- **`manipulateAsync` の戻り値 `base64` は条件付き**: `saveOptions.base64: true` を渡したときだけ含まれる。型上は optional なので `if (!out.base64) throw ...` ガード必須
- **2 段階 manipulate で長辺基準リサイズ**: 1 回目は `actions=[]` で dimensions だけ取得、2 回目で `resize` 指定。`resize: { width }` 単独なら高さは比例計算される(`{ width, height }` 両方指定すると distort)
- **アップスケール防止**: `resize: { width: 1024 }` を 800px 幅の画像に渡すと 1024 に**拡大される**。`Math.min(MAX_LONG_SIDE, originalDim)` で元サイズ以下に絞る
- **`SaveFormat.JPEG` で HEIC 自動変換**: ピッカーから返った HEIC URI も、JPEG 出力指定で問題なく変換される。`expo-image-manipulator` が内部で iOS の ImageIO に流すため、専用ライブラリ不要
- **base64 → 元バイト数の換算は `length * 0.75`**: base64 は元バイトの約 4/3 倍。kB なら `Math.round(length * 0.75 / 1024)`。デバッグ表示用なら精度は近似で十分
- **`data:image/jpeg;base64,` プレフィックスは付かない**: `manipulateAsync` が返す `base64` は生文字列のみ。Web の `canvas.toDataURL` とは違う。Workers の `/api/divine` も生 base64 前提
- **`prepareForUpload` の呼び出し位置は API 送信直前(16)**: プレビュー画面では原本を見せ、送信時だけ圧縮するのが UX 上効率的(キャンセル時の無駄圧縮を防ぐ)。14 段階では 12/13 の Alert に一時組み込み、15/16 着手時に Alert ごと置換
- **`expo-image-manipulator` は Config Plugin 不要**: ネイティブ権限を要求しない純粋な画像変換ライブラリ。`app.config.ts` の `plugins` に追加しなくてよい
- **長辺 1024 / quality 0.8 でサイズ目安**: 大抵の写真で 100-700 kB に収まる。1MB を超えるなら quality を下げるか、長辺を 800 に絞る検討

## チケット 23 完了時の知見

- **`eas init` が dynamic config(`app.config.ts`)では projectId を自動追記できない**: `app.json` ベースなら勝手に書き込むが、`app.config.ts` (動的設定)では「Cannot automatically write to dynamic config」エラーで終了する。**手動で `extra.eas.projectId` を `app.config.ts` に追記**するのが正解。エラー終了でもプロジェクト作成自体は成功している(`expo.dev/accounts/.../projects/` に表示される)
- **`eas init --non-interactive --force`**: 初回作成時は `--force` が必要(プロジェクトが存在しないと自動的に拒否される)。CI/自動化スクリプトから呼ぶ場合の必須フラグ
- **3 プロファイル設計の意図**: `development` は dev client + stub auth(Expo Go 代替の開発用)、`preview` は APK + 本番認証(Internal Testing で本番動作テスト)、`production` は AAB + 本番認証(Play Store 提出)。bundleId は development/preview が `.dev` 付き、production だけ clean
- **`appVersionSource: "remote"` でビルド番号を EAS が一元管理**: ローカル `version` の更新不要、`production.autoIncrement: true` との組合せで Play Store の versionCode が自動連番化
- **`buildType: "apk"` (dev/preview) vs `"app-bundle"` (production)**: APK は直接インストール / Internal 配布用、AAB は Play Store 提出必須形式。両方持つことで「テスト時は素早く APK」「リリース時は AAB」を使い分けられる
- **`distribution: "internal"` は EAS の APK ホスティング**: 30 日間 EAS が URL/QR で配信、ストア外配布が手軽。dev/preview に使う。production には書かない(ストア経由)
- **`EXPO_PUBLIC_*` の env 優先順位**: EAS Build 中は **`eas.json` の `profile.env` が `.env` より勝つ**。ローカル `npm start` は `.env` を読む。この使い分けで「dev 開発時は stub、ビルド時は profile 通り」が成立
- **キーストア自動生成は EAS 任せ**: 手動 `.keystore` 作成不要。失われたら `eas credentials -p android --reset-key` で再生成可能だが、**既リリース後の reset は致命的**(同一アプリの更新が出せなくなる)。初回ビルド後にバックアップを取る習慣を
- **`app.config.ts` と `app.json` の併存 NG**(01 完了知見再確認): `eas init` 実行時に `app.json` が新規作成される挙動が出る場合は、書かれた `extra.eas.projectId` を `app.config.ts` に移して `app.json` を削除
- **submit profile の `track: "internal"`**: Play Console の Internal Testing トラックに提出。release への promote は Play Console UI から手動(誤ストア提出を防ぐ二重承認)
- **チケット 25 完了まで preview/production の実ビルドは Google ログインが動かない**: `EXPO_PUBLIC_GOOGLE_*_CLIENT_ID` 未定義 + キーストア SHA-1 未登録のため。dev プロファイルなら stub のままで実機動作確認できる
- **iOS は `eas.json` に書かない**(フェーズ 2): `eas build` 時に `--platform android` 限定で呼ぶ。iOS profile 追加はフェーズ 2 着手時

## チケット 25 完了時の知見

### Google OAuth の選定:なぜ自前フローになったか

- **`expo-auth-session/providers/google` は `@deprecated`** で機能不全。Google プロバイダの `useAuthRequest` は `androidClientId` 経路で OAuth リクエストを作るが、**Android Client ID は本来「Google Play Services SDK のネイティブフロー専用」** で、ブラウザ/Custom Tabs 経由の OAuth リクエストには対応していない → Google が `invalid_request` で弾く
- **`@react-native-google-signin/google-signin` は OOM**: ネイティブ SDK 同梱で C++ コンパイルが重く、EAS Free tier の `medium` リソース(4GB)では Gradle / CMake が OOM。`large` は有料プラン($19/月)専用なので Free では使えない
- **採用した解決策: Web Client ID + PKCE + HTTPS リダイレクトプロキシ**。`expo-web-browser` の `openAuthSessionAsync` で Custom Tabs を開き、HTTPS の redirect_uri(GitHub Pages の HTML)経由で custom scheme に戻す。OAuth コードはアプリ側で直接 Google トークンエンドポイントに POST(PKCE で client_secret 不要)

### 実装の要点

- **`lib/auth/google.ts` は関数 API**(`signInWithGoogle()` を直接呼ぶ)。Hook の制約がないので login 画面側の Hook 分離コンポーネント化は不要。`login.tsx` が `GoogleLoginButton`/`StubLoginButton` の AUTH_MODE 分岐だけ
- **`WebBrowser.maybeCompleteAuthSession()` をモジュールトップで呼ぶ**: redirect 後のアプリ復帰時にブラウザを閉じる必須処理。`useEffect` ではなくモジュール初期化時に 1 回呼ぶのが公式パターン
- **PKCE 実装は `expo-crypto` で自前**: `Crypto.getRandomBytesAsync(32)` → base64url(`+→-`, `/→_`, `=` 除去)で `code_verifier`、`Crypto.digestStringAsync(SHA256, verifier, { encoding: BASE64 })` → 同じ base64url 変換で `code_challenge`。state も同様に乱数生成して CSRF 対策
- **`id_token` の `sub` 取得は自前 base64url decode**(`lib/auth/google.ts:decodeJwtPayload`)。`jose` は Workers 側だけで使う。padding 計算は `(4 - len % 4) % 4`
- **`URL` パーサに頼らずクエリ部分だけ手で切る**: `result.url` は custom scheme なので `new URL(...)` が環境によって失敗する。`indexOf('?')` 以降を `URLSearchParams` で安全に解析

### Google Cloud Console と Workers の対応

- **Web Client ID のみ使う**(Android Client ID は使わない、登録だけ残してもよい)。Workers の `GOOGLE_CLIENT_IDS` は **Web Client ID** で、id_token の `aud` も Web Client ID(Google の token エンドポイントで `client_id=WEB_CLIENT_ID` を送るため)
- **HTTPS リダイレクト URI を Web Client ID に登録**: `https://hohoemi-rabo.github.io/uranai-kikkake/oauth/redirect.html`(GitHub Pages)。本番 Workers 用に別 HTTPS を立てる必要はない、GitHub Pages で完結
- **OAuth 同意画面のスコープ追加必須**: `openid` / `.../auth/userinfo.profile` / `.../auth/userinfo.email` の 3 つ。`email` を抜くと `invalid_request` で弾かれることがある(クライアント側 scope と一致しない場合)
- **テストユーザー登録必須**(公開ステータス「テスト中」運用):自分の Google アカウントを test users に追加しないと **アプリ自体のオーナーでもログインできない**

### リダイレクト HTML(GitHub Pages 配信)

- `oauth/redirect.html` を **リポ root の `oauth/` 配下** に配置 → GH Pages root 配信で `/oauth/redirect.html` に公開される
- HTML は `window.location.search` でクエリを取り、`uranaikikkake://oauth/google/callback?...` に JS で `window.location.replace`。1.5 秒経っても遷移しなければ手動リンク表示でフォールバック
- カスタムスキームへの **HTTP リダイレクト(302)はブラウザがブロック** するので、必ず **JavaScript 側からの遷移** で行う

### 環境変数とビルドの落とし穴

- **`EXPO_PUBLIC_AUTH_MODE=stub` で Expo Go を温存**: ローカル `.env` を stub のまま、`eas.json` の preview/production だけ google にして使い分け。Expo Go 開発フローは死なない
- **Client ID は機密ではない**(audience 識別子)。`EXPO_PUBLIC_*` で JS バンドルに展開しても OK。Public Client(モバイル)では Client Secret は使わない
- **`eas.json` の `env` は空文字 NG**: `"EXPO_PUBLIC_*": ""` で `eas build` が `is not allowed to be empty` で止まる。Client ID 未取得段階では env キーごと書かない
- **Android `applicationId` はハイフン `-` 不可**: `jp.hohoemi-rabo.uranaikikkake` 形式は EAS Build で `Invalid format of Android applicationId. Only alphanumeric characters, '.' and '_' are allowed` で弾かれる。`jp.hohoemirabo.uranaikikkake` のように除去
- **`eas build --profile development` 初回時に `expo-dev-client` が自動追加**: EAS CLI が「入れますか?」と聞いてくる。yes で `package.json` に SDK 互換版が入る
- **EAS Free tier のビルド数は 30 回/月**。失敗もカウントされる。OOM やリトライで消費しやすいので、設定確認をしっかりやってからビルドを叩く

## チケット 22 完了時の知見

- **`sharp` の SVG ラスタライズは librsvg ベースで CJK フォントがシステム依存**: WSL/Ubuntu の標準環境には日本語フォントが入っていない。`fc-list :lang=ja` が空なら「占キ」が豆腐 (□) になる。`fonts-noto-cjk` apt install が定番だが、**sudo 無しなら `~/.fonts/` に既存の TTF を置いて `fc-cache -f ~/.fonts`** でユーザー領域に登録できる
- **アプリ本体の `@expo-google-fonts/m-plus-rounded-1c` をアイコンにも流用**: `node_modules/@expo-google-fonts/m-plus-rounded-1c/900Black/MPLUSRounded1c_900Black.ttf` を `~/.fonts/` にコピーすればブランド一貫性 + 環境セットアップが完結。SVG の `font-family` には fontconfig family 名 `Rounded Mplus 1c Black` を指定
- **SVG ソースは `assets/svg/` にコミット、PNG は生成物**: PNG だけ残すと再編集時に「ピクセル塗り直し」になり破綻。SVG をリポに残しておけば `<text>` 1 行で配色・テキスト変更が完結。`npm run generate-icons` で 9 ファイル一括再生成
- **`sharp({ density: 384 })` でアンチエイリアス確保**: SVG の density はデフォルト 72。1024 出力時にエッジが粗くなる。384 にすると拡大時の品質が大幅改善(ファイルサイズは僅増)
- **Android Adaptive Icon の安全領域は中央 66%(約 676×676 pixel)**: foreground PNG の外側 22% はマスクで切られる可能性。テキストは font-size 360 程度に抑えて中央に収める。background は全面塗りつぶしで OK(マスクの背面に出る)
- **App Store 用アイコンは透過 NG / 角丸 NG**: `sharp.flatten({ background: '#FB7185' })` で alpha を平坦化。Apple 側で自動角丸処理されるので、PNG 自体は四角形で出す
- **`splash-icon.png` は `imageWidth: 200` 表示**: `app.config.ts:42` で指定の `expo-splash-screen` 設定値。PNG 自体は 200×200 で出すと 1:1 表示、`backgroundColor: '#F0F9FF'` が周囲を埋める
- **themed icon(Android 13+)用の monochrome PNG**: 単色シルエットを透過背景に。OS のテーマカラーで自動再着色されるので塗りつぶしは黒/白どちらでも OK
- **Play Store 機能グラフィック 1024×500 は審査必須**: アプリ名 + 短いサブタイトル + ブランドカラーが定石。`assets/store/play-feature-graphic-1024x500.png` を出力して提出ファイルにする
- **`assets/store/` と `assets/images/` の分離**: アプリビルドに含まれるのは `assets/images/`(`app.config.ts` 参照先)、ストア提出物は `assets/store/`。混在させるとアプリバンドルが肥大化する
- **生成スクリプトは `package.json` の `scripts` に登録**: `"generate-icons": "node scripts/generate-icons.mjs"`。`npm run generate-icons` で他チケットからも呼べる

## チケット 21 完了時の知見

- **ポリシーページは `legal/` に root 配置 + GH Pages root 配信**: `docs/` 配信にすると既存のティケット MD (`docs/00-INDEX.md` 等) まで GH Pages に晒される。`legal/` 専用ディレクトリ + root 配信なら隔離できる
- **`.nojekyll` で Jekyll を完全無効化**: GH Pages はデフォルトで Jekyll を有効化し、`_layout.tsx` などの underscore 始まりファイルを無視する可能性がある。空ファイル `.nojekyll` を root に置くと Jekyll 処理がスキップされ、リポ内ファイルがそのまま静的配信される。React Native プロジェクトでは必須
- **`settings.tsx` の URL 定数 2 箇所が単一の信頼ソース**: ポリシー URL を変更する場合は `PRIVACY_URL` / `TERMS_URL` の 2 定数のみ更新。アプリ内に他の参照箇所はない(設定画面の 2 つのハンドラから参照)
- **`<meta name="viewport">` を必ず入れる**: モバイルアプリの `expo-web-browser` で開かれる前提なので、レスポンシブ化されていないと文字が小さく表示される。`width=device-width, initial-scale=1` がデフォルト推奨
- **シニア向け CSS パターン**: body `font-size: 18px`, `line-height: 1.8`, アクセント色は `--accent: #fb7185`(charm のローズ色)。アプリ本体のテーマと色を揃えると一貫性が出る
- **ストア提出 URL は public でなければならない**: private repo の GH Pages はストア審査でアクセスできず差し戻し。public 化 or 別ホスト必須。GH Pages は public リポなら無料
- **改定日と発行者の明記**: 各 HTML の末尾 `<p class="meta">` に「最終更新日」「発行者」を入れる。ストア審査で「いつ・誰が出したポリシーか」が分からないと差し戻されることがある(REQUIREMENTS §8.1.1 / §8.2.1)
- **GH Pages 有効化はユーザー手動操作**: コード差分では完結しない。GitHub.com の Settings → Pages から 1 回設定が必要。完了知見として明記しておくと未来のメンテナーが迷わない

## チケット 20 完了時の知見

- **`(auth)/_layout.tsx` の onboarding whitelist パターン**: `usePathname() === '/onboarding'` で whitelist。expo-router の `usePathname()` は group prefix(`(auth)`)を除いた path を返すので `/onboarding`(`/(auth)/onboarding` ではない)で一致。認証済みユーザーが設定画面から「はじめての方へ」を再表示するための **最小限の改変**。login 側は引き続き「認証済みなら /(main) にリダイレクト」が効く
- **設定画面からの onboarding 完了後の挙動は既存ガードに任せる**: onboarding.tsx は `router.replace('/(auth)/login')` で締めるが、認証済みユーザーは (auth)/_layout のガードで自動的に /(main) に飛ばされる。**特別なフラグや分岐は不要**、既存のリダイレクト連鎖に任せると一周してホームに戻る
- **`signOut` 後の遷移は (main)/_layout のガードに任せる**: 設定画面で `signOut()` を呼ぶだけで、`session === null` になった瞬間 (main)/_layout が `<Redirect href="/(auth)/login" />` を返す。`router.replace('/(auth)/login')` を明示する必要なし
- **`Constants.expoConfig?.version` で動的バージョン取得**: `app.config.ts` の `version` フィールドをそのまま読み込み。EAS Build 後はビルド番号(`ios.buildNumber` / `android.versionCode`)も同経由で取れる。**ハードコード禁止**(リリースごとに 2 箇所更新するのは事故のもと)
- **`expo-web-browser` の `openBrowserAsync`**: in-app ブラウザ(SFSafariViewController / Chrome Custom Tabs)で開くため、ユーザーがアプリを離脱しない。`react-native-webview` の重い依存(ネイティブモジュール)を追加せずに済む。失敗時のフォールバックは `.catch` で Alert
- **`Linking.openURL('mailto:...')` の日本語 subject は `encodeURIComponent`**: 多くの端末で生 UTF-8 でも通るが、URI エンコードしておくのが安全策。`'mailto:...?subject=' + encodeURIComponent('占いキッカケのお問い合わせ')` の形
- **ログアウトと「はじめての方へ」は確認 Alert 必須**: シニア層の誤タップ事故を防ぐ。`Alert.alert(タイトル, 説明, [{ text: 'キャンセル', style: 'cancel' }, { text: '実行', style: 'destructive', onPress: ... }])` の 2 択型を使う。`destructive` style は iOS で赤文字表示になり、不可逆操作を視覚的に警告
- **ポリシー URL は 21 で正式に差し替え前提のプレースホルダ**: `app/(main)/settings.tsx` 冒頭の `PRIVACY_URL` / `TERMS_URL` 定数 2 箇所のみ更新すれば 21 着手で完結。`// TODO: チケット 21 で正式 URL に差し替え` コメントで grep 発見性も確保
- **`MenuRow` のような小さい共通行コンポーネントは同ファイル内**: `components/` に切り出すほどでもない単機能 UI は **使う画面の中で関数定義**する方が認知コスト低い。React Compiler 下なので memo 不要

## チケット 18 完了時の知見

- **`captureRef` の `width` と ResultCard 側の `width` は両側で 1080 揃え**: ResultCard を `width: 1080` で render → `captureRef({ width: 1080 })` で 1:1 書き出し。片方だけ 1080 にするとスケール由来でテキスト劣化やレイアウト崩れが起きる。「render サイズ = キャプチャサイズ」が安定する組み合わせ
- **off-screen 配置は四重防御**: `position: 'absolute'` + `top: -10000` + `opacity: 0` + `pointerEvents="none"` を **すべて指定**。`top` だけだと画面アニメ時に一瞬チラ見え、`opacity` だけだと操作奪取、`pointerEvents` だけだと描画コスト無駄。常時マウントしておくことで「ボタンタップ→即キャプチャ」が ref null 事故なく走る
- **`collapsable={false}` を ResultCard の root View に必ず付ける**: Android view-flattening 最適化で空 View が消える事故対策(`react-native-view-shot` 公式推奨)。`captureRef` 対象 View には必須
- **`forwardRef<View, Props>` で ref を中継**: 親で `useRef<View>(null)` し、`<ResultCard ref={cardRef} ... />` で渡す。型は `forwardRef<View, Props>`(`RNView` ではなく `react-native` から import した `View`)。screen 本体は `forwardRef` 不要、子の保存用カードのみ
- **`router.replace` params は文字列のみ**: 元画像 URI を持ち回るために `uri` を追加するときは string で渡す。preview から渡すのは **リサイズ前の原本 URI**(`prepareForUpload` で圧縮するのは API 送信用、保存画像には原本を使う方が綺麗)
- **MediaLibrary 権限は書込専用でも保存可**: `NSPhotoLibraryAddUsageDescription`(`savePhotosPermission`)のみで `saveToLibraryAsync` が動く。読込権限(`photosPermission`)は不要(02 完了知見の延長)。iOS Limited Photos モードでも保存は通る
- **`MediaLibrary.requestPermissionsAsync(true)` で writeOnly を指定**: 引数なしで呼ぶと AUDIO 権限まで一括要求してしまい、AndroidManifest に AUDIO 宣言がない(占いアプリでは不要)場合 `"You have requested the AUDIO permission, but it is not declared in AndroidManifest"` で reject される。`writeOnly: true` を渡すと書込専用に絞られて安全。`expo-camera`/`expo-image-picker` 側で `microphonePermission: false` にしているプロジェクトでは **必須**
- **`Alert.alert` で保存成功通知**: Toast ライブラリ未導入。シニア向けには **モーダル Alert** で「保存できたか分からない」事故を防ぐ方が UX 整合。`'写真アプリに保存しました!'` で完結
- **`expo-image` の写真表示は `contentFit="cover"`**: 原本写真が縦長/横長でもカード内 `aspectRatio: 1` の枠で中央クロップ。`contain` だと余白が出てカード全体のバランスが崩れる
- **`react-native-view-shot` は Config Plugin 不要**: 内部で iOS Core Graphics / Android Canvas を直叩きする純粋 JS API。`npx expo install react-native-view-shot` だけで完結
- **`useRef<View>(null)` の型と `RefObject<View | null>`**: hook 引数に渡すときは `RefObject<View | null>` で受ける(React 19 / TS の `useRef` は `T | null` を返すため)。`RefObject<View>` だと `cardRef.current` が non-null と推論されて null チェックが消える
- **保存ボタンの `disabled` は `isSaving || !photoUri` で二重ガード**: photoUri が空文字(preview 経由でない直接遷移)時はボタンを disable して灰色化。連打防止と「保存対象なし」状態を視覚的に区別

## チケット 17 完了時の知見

- **`Speech.speak` の内蔵キューに任せて順次再生**: 複数回 `Speech.speak` を呼ぶだけで Android/iOS 双方が自動キューイング。`onDone` を Promise で chain する自前ラッパーは不要。`onDone` は **最後の発話のみ** に `setIsSpeaking(false)` を載せる(途中で下ろすと UI 不整合)
- **`Speech.stop()` を `speak()` 冒頭で必ず先行呼び**: React state だけでは「停止→即タップ→開始」のレースで前回の発話キューが残る。冪等な `Speech.stop()` を毎回先頭で呼ぶことで連打耐性が出る
- **`onStopped` は全発話に設定して冪等下げ**: Android で `Speech.stop()` を呼ぶと各キューエントリの `onStopped` が個別発火することがある。`setIsSpeaking(false)` は何度呼んでも安全なので、全発話に同じ handler を載せておくのが最も楽
- **`useEffect(() => { return () => Speech.stop(); }, [])` で全離脱経路をカバー**: `router.replace` / ハードウェアバック / アプリバックグラウンド遷移すべてで `useEffect` cleanup が走るため、画面遷移ごとに手動で `stop()` を呼ぶ必要なし。**Hook 内に閉じ込められる**ので呼び出し側の result.tsx は cleanup を意識しなくていい
- **`expo-speech` は Config Plugin 不要**: 音声**出力**のみでマイク権限を要求しないため `app.config.ts` の `plugins` 配列に追加不要。`npx expo install expo-speech` だけで完結(`expo-camera` / `expo-image-picker` / `expo-media-library` と違う点)
- **`isSpeakingAsync()` は遅延があるのでローカル `useState` でトラック**: 親 CLAUDE.md にも書いたが、再確認。タップ即時 UI 反映には async API は遅すぎる。`setIsSpeaking(true/false)` を speak/stop/onDone/onStopped/onError の全分岐で正しく呼ぶことで一貫性が出る
- **読み上げ対象は 3 フィールドに絞る**: REQUIREMENTS §4.5.1 で「動物 → 占いメッセージ → おすすめの話題」と明示。`title`(キャッチコピー)・`luckyItem`(モノ名)・`advice`(短い)は読み上げから除外。シニア向けに「核心情報」だけ耳で聞ける設計で、長文化も避ける
- **`speak(parts: string[])` の引数型**: 単一文字列 + 内部で `.split('。')` するより、**呼び出し側がフィールド配列を渡す**設計の方が読み上げ単位を明示的に制御できる。`parts.filter((p) => p.trim().length > 0)` で空文字を除外しておくと API レスポンス欠損時にも落ちない
- **iOS シミュレータでは `expo-speech` は動作しない**: 実機必須。フェーズ 1 = Android 専用検証だが、フェーズ 2 で iOS 実機検証時にサイレントモード時の挙動を確認すること(iOS は AVAudioSession のカテゴリ次第で無音になる場合がある)

## チケット 16 完了時の知見

- **`withDelay` + `withTiming` の並列スタガーで `withSequence` は要らない**: セクションごとに `useSharedValue`(opacity / translateY)を 1 セット持ち、`useEffect` 内で `value = withDelay(d, withTiming(target, { duration }))` を起動するだけ。`withSequence` で chain しなくても delay の数値で順番制御できる。`StaggerSection` のような小コンポーネントに切り出すと、画面コードが平坦になり読みやすい
- **タイプライター完了の検知は callback ではなく時間予測で済ませる**: `personality.length * 35ms` を上限値(例: 9s)で cap した値を「タイプ完了見込み」として後続セクションの delay に足し込む。callback ベースの順次 reveal は実装が分散して壊れやすい。「並列スタガー + 時間予測」の方が React Compiler とも相性が良い(state 経由の reveal フラグが消える)
- **`TypewriterText` の `useEffect` 依存配列に `text` を含める**: props 更新で文字列が変わった場合に正しくリセットされる。`setCount(0)` を effect の先頭で呼び、`clearTimeout` + `clearInterval` を両方 cleanup する(`setTimeout` で開始遅延、その中で `setInterval` を張る 2 段構造)。`useRef` で id を持つ必要はなく、effect のクロージャ内ローカル変数で十分
- **`useLocalSearchParams` の JSON は **必ず** try/catch + 最小フィールドチェック**: typedRoutes でも文字列の中身までは型保証されない。`DivineResultBody` のような複合オブジェクトを params で渡すなら、受け取り側に `parseResult(raw): T | null` を置いて防御。不正なら `router.replace('/(main)')` で穏便にホームへ戻す(`useEffect` で副作用、初回レンダ中は `if (!result) return null`)
- **`isTabKey` のような型ガードは `constants/theme.ts` に集約**: 同じガードを preview と result でコピペすると、将来モード追加(フェーズ 2)時に片方の更新を忘れる。`TabKey` の定義と一緒の場所に export しておくと grep で 1 箇所完結
- **動的アクセント色の集中**: `borderLeftWidth: 4, borderLeftColor: Colors[mode]` のように左ボーダー幅とアクセント色をまとめて `style` に書く。className 側に `border-l-4` を残すと、`borderLeftColor` だけ style で当てる二重指定になって rules がぶれる。**色も幅も style 一方に寄せる**のが安全
- **ScrollView の `contentContainerStyle` で `gap` を使う**: NativeWind の `gap-4` でも動くが、ScrollView 直下では `contentContainerStyle={{ gap: 16, paddingHorizontal: 24, paddingBottom: 32 }}` のように style 値で書く方が、`paddingBottom`(下端の余白確保)と一括管理できる
- **エンタメ注釈の文言は本画面が「3 箇所明示」のうちの 1 つ**: REQUIREMENTS §8.1.1 が「オンボーディング・結果・ストア説明文」の 3 箇所での明示を要求している。結果画面下部に「※ 占いはエンターテイメントです。会話のきっかけとしてお楽しみください。」を `text-xs text-slate-500` で配置。フォントは `font-rounded`(bold は使わない)で控えめに
- **結果画面の「最初に戻る」は `router.replace('/(main)')`**: `router.push` だとホームの上に積み上がってメモリリークの原因。`router.back()` は preview を経由してしまうので NG(15 の `router.replace` 設計と整合)
- **17/18 未完成でも 16 を完了扱いにできる運用**: 「🔊 読み上げる」「💾 画像を保存」ボタンは Alert スタブ + `// チケット NN で … に差し替え` コメントで先行配置。17/18 着手時に grep でコメントを見つけて剥がす(12→15 と同じ運用)
- **`StaggerSection` の `useEffect` 依存配列に shared value を含める**: lint(`react-hooks/exhaustive-deps`)が要求するため、`[delayMs, opacity, translateY]` を渡す。Reanimated の shared value 参照は安定なので警告は出るがランタイム問題はない

## チケット 15 完了時の知見

- **`apiFetch` の 401 自動 signOut とフックの 'unauthorized' は二重防御**: フック側でも判別共用体に `unauthorized` を持たせると UI 側の switch が exhaustive になる。`apiFetch` の signOut が `Redirect` 経由でログイン画面に飛ばすので UI 側で `signOut` 再呼び出し不要
- **判別共用体 `DivineOutcome` の利点**: try/catch + 個別 error class より、UI 側の `switch (outcome.kind)` の方が網羅性が TS で担保される。Outcome を返す関数は **throw しない契約**にして、呼び出し側で `if (outcome.ok)` するスタイルが React と相性良い
- **`expo-image` の `cachePolicy="memory-disk"`**: 結果画面から戻った時の再ロードを防ぐ。原本画像は同セッション中に何度も見せる前提
- **`contentFit="contain"` がアスペクト比対応の最適解**: 縦長 / 横長 / 正方形どれでも切れない。`aspectRatio: 1` で固定すると人物画像が顔切れする
- **`AnalyzingOverlay` の `pointerEvents="auto"`**: タップを奪うことで「撮り直す」や CTA の再押下を物理的に防ぐ。`pointerEvents="none"` だと spinner 越しに連打できてしまう
- **`useUsage().updateUsage` は API レスポンスの `usage` をそのまま渡せばよい**: JST 日付は `useUsage` 側で自動付与。成功時に呼ぶだけで `UsageBadge` に Context 経由で反映
- **`router.push` でプレビュー、`router.replace` で結果画面**: プレビューは履歴に残し(撮り直し用)、結果から戻る時はプレビューを飛ばしてホームへ。これでユーザーが「結果 → 戻る → プレビュー → 戻る → ホーム」と回り道しない
- **`.env` の `EXPO_PUBLIC_API_BASE_URL` 変更は Metro クリア必須**: `npx expo start --clear` で再起動。HMR は env を再読み込みしない。`.env` は `.gitignore` 対象外(`.env*.local` だけ除外)なのでデフォルトで commit される
- **`prepareForUpload` の呼び出し位置**: プレビュー画面で原本表示 → CTA タップ時に圧縮 → 即 API 送信。プレビュー表示時に圧縮すると撮り直し時の無駄圧縮になる
