#!/usr/bin/env node
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const SOURCE_DIR = join(ROOT, 'assets/source');
const SVG_DIR = join(ROOT, 'assets/svg');
const IMG_DIR = join(ROOT, 'assets/images');
const STORE_DIR = join(ROOT, 'assets/store');
mkdirSync(STORE_DIR, { recursive: true });

const SRC_ICON = join(SOURCE_DIR, 'icon.png');
// icon.png 背景のクリーム色(角丸のフチを延長して四隅を埋める用)
const CREAM_BG = '#F8F1E5';

async function resizePng(srcPath, outPath, { width, height, flatten } = {}) {
  let pipe = sharp(srcPath);
  if (width || height) {
    pipe = pipe.resize(width, height, {
      fit: 'contain',
      background: flatten ?? { r: 0, g: 0, b: 0, alpha: 0 },
    });
  }
  if (flatten) pipe = pipe.flatten({ background: flatten });
  await pipe.png().toFile(outPath);
  console.log(`  ${outPath.replace(ROOT + '/', '')}`);
}

async function solidPng(outPath, color, { width = 1024, height = 1024 } = {}) {
  await sharp({
    create: { width, height, channels: 4, background: color },
  })
    .png()
    .toFile(outPath);
  console.log(`  ${outPath.replace(ROOT + '/', '')}`);
}

async function svgToPng(svgPath, outPath, { width, height, flatten } = {}) {
  let pipe = sharp(svgPath, { density: 384 });
  if (width || height) pipe = pipe.resize(width, height);
  if (flatten) pipe = pipe.flatten({ background: flatten });
  await pipe.png().toFile(outPath);
  console.log(`  ${outPath.replace(ROOT + '/', '')}`);
}

const FEATURE_SVG = join(SVG_DIR, 'feature-graphic.svg');
const MONOCHROME_SVG = join(SVG_DIR, 'adaptive-monochrome.svg');

console.log('Generating app icons:');
// メインアイコン: master PNG を 1024 にアップスケール
await resizePng(SRC_ICON, join(IMG_DIR, 'icon.png'), { width: 1024, height: 1024 });
// Android Adaptive foreground: master PNG を透過背景で(マスクで切られる前提)
await resizePng(SRC_ICON, join(IMG_DIR, 'android-icon-foreground.png'), {
  width: 1024,
  height: 1024,
});
// Adaptive background: クリーム単色(アイコン背景と一体感)
await solidPng(join(IMG_DIR, 'android-icon-background.png'), CREAM_BG);
// Monochrome: 4 点星のシルエット(themed icon 用)
await svgToPng(MONOCHROME_SVG, join(IMG_DIR, 'android-icon-monochrome.png'), {
  width: 1024,
  height: 1024,
});
// スプラッシュ / favicon
await resizePng(SRC_ICON, join(IMG_DIR, 'splash-icon.png'), { width: 200, height: 200 });
await resizePng(SRC_ICON, join(IMG_DIR, 'favicon.png'), { width: 48, height: 48 });

console.log('Generating store assets:');
// App Store: 透過 NG → クリームで平坦化
await resizePng(SRC_ICON, join(STORE_DIR, 'app-store-icon-1024.png'), {
  width: 1024,
  height: 1024,
  flatten: CREAM_BG,
});
// Play Store: 512
await resizePng(SRC_ICON, join(STORE_DIR, 'play-store-icon-512.png'), {
  width: 512,
  height: 512,
});
// 機能グラフィック(横長バナー): SVG ベース
await svgToPng(FEATURE_SVG, join(STORE_DIR, 'play-feature-graphic-1024x500.png'), {
  width: 1024,
  height: 500,
  flatten: CREAM_BG,
});

console.log('\nDone.');
