#!/usr/bin/env node
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const SVG_DIR = join(ROOT, 'assets/svg');
const IMG_DIR = join(ROOT, 'assets/images');
const STORE_DIR = join(ROOT, 'assets/store');
mkdirSync(STORE_DIR, { recursive: true });

// 角丸 → 平坦化用の背景色。アプリアイコンの濃紺グラデの最上段に合わせる。
// (App Store / Play Store のアイコンは透過 NG なので、四隅をこの色で埋める)
const DARK_BG = '#1E1B4B';

const ICON_SVG = join(SVG_DIR, 'icon.svg');
const ADAPTIVE_FG_SVG = join(SVG_DIR, 'adaptive-foreground.svg');
const ADAPTIVE_BG_SVG = join(SVG_DIR, 'adaptive-background.svg');
const ADAPTIVE_MONO_SVG = join(SVG_DIR, 'adaptive-monochrome.svg');
const FEATURE_SVG = join(SVG_DIR, 'feature-graphic.svg');
// Play Console のデベロッパープロフィール用(ほほ笑みラボのブランドアセット)
const DEV_ICON_SVG = join(SVG_DIR, 'dev-icon.svg');
const DEV_HEADER_SVG = join(SVG_DIR, 'dev-header.svg');

async function svgToPng(svgPath, outPath, { width, height, flatten, density = 384 } = {}) {
  let pipe = sharp(svgPath, { density, limitInputPixels: false });
  if (width || height) pipe = pipe.resize(width, height);
  if (flatten) pipe = pipe.flatten({ background: flatten });
  await pipe.png().toFile(outPath);
  console.log(`  ${outPath.replace(ROOT + '/', '')}`);
}

console.log('Generating app icons:');
// メインアイコン(iOS / 一般): 濃紺グラデ + 占 + sparkles の完成版
await svgToPng(ICON_SVG, join(IMG_DIR, 'icon.png'), { width: 1024, height: 1024 });
// Android Adaptive: foreground(透過 BG の上に占)+ background(濃紺グラデ + sparkles)
await svgToPng(ADAPTIVE_FG_SVG, join(IMG_DIR, 'android-icon-foreground.png'), {
  width: 1024,
  height: 1024,
});
await svgToPng(ADAPTIVE_BG_SVG, join(IMG_DIR, 'android-icon-background.png'), {
  width: 1024,
  height: 1024,
});
// Monochrome: 占 シルエット(themed icon)
await svgToPng(ADAPTIVE_MONO_SVG, join(IMG_DIR, 'android-icon-monochrome.png'), {
  width: 1024,
  height: 1024,
});
// スプラッシュ: メインアイコンの縮小版(濃紺スプラッシュ背景にそのまま乗る)
await svgToPng(ICON_SVG, join(IMG_DIR, 'splash-icon.png'), { width: 200, height: 200 });
// favicon: 同じくメインアイコンの縮小版
await svgToPng(ICON_SVG, join(IMG_DIR, 'favicon.png'), { width: 48, height: 48 });

console.log('Generating store assets:');
// App Store: 透過 NG → 濃紺で平坦化(四隅の余白も濃紺で埋める)
await svgToPng(ICON_SVG, join(STORE_DIR, 'app-store-icon-1024.png'), {
  width: 1024,
  height: 1024,
  flatten: DARK_BG,
});
// Play Store: 512x512
await svgToPng(ICON_SVG, join(STORE_DIR, 'play-store-icon-512.png'), {
  width: 512,
  height: 512,
});
// 機能グラフィック(横長バナー): SVG ベース
await svgToPng(FEATURE_SVG, join(STORE_DIR, 'play-feature-graphic-1024x500.png'), {
  width: 1024,
  height: 500,
  flatten: DARK_BG,
});

console.log('Generating Play Console developer profile assets:');
// Play Console デベロッパーアイコン: 512x512、JPEG/PNG 非透過、最大 1MB
await svgToPng(DEV_ICON_SVG, join(STORE_DIR, 'play-developer-icon-512.png'), {
  width: 512,
  height: 512,
  flatten: DARK_BG,
});
// Play Console デベロッパーヘッダー: 4096x2304、JPEG/PNG 非透過、最大 1MB
// density=96(デフォルト) を指定 — 大きい出力サイズ + 高 density だと sharp が中間バッファで pixel limit に当たる
await svgToPng(DEV_HEADER_SVG, join(STORE_DIR, 'play-developer-header-4096x2304.png'), {
  width: 4096,
  height: 2304,
  flatten: DARK_BG,
  density: 96,
});

console.log('\nDone.');
