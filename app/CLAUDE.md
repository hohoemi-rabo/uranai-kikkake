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
- **動作確認用のログアウトボタンはホーム画面に仮置き**: 設定画面(チケット 20)が無いため。ボタン上に `{/* チケット 20 で設定画面に移管 */}` コメントを残してある。20 着手時に grep で見つけて剥がす。

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
