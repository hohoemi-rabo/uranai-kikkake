#!/usr/bin/env node
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const SVG_DIR = join(ROOT, 'assets/svg');
const IMG_DIR = join(ROOT, 'assets/images');
const STORE_DIR = join(ROOT, 'assets/store');
mkdirSync(STORE_DIR, { recursive: true });

const ROSE = '#FB7185';

async function svgToPng(svgPath, outPath, { width, height, flatten } = {}) {
  let pipe = sharp(svgPath, { density: 384 });
  if (width || height) pipe = pipe.resize(width, height);
  if (flatten) pipe = pipe.flatten({ background: flatten });
  await pipe.png().toFile(outPath);
  console.log(`  ${outPath.replace(ROOT + '/', '')}`);
}

const ICON_SVG = join(SVG_DIR, 'icon.svg');
const FEATURE_SVG = join(SVG_DIR, 'feature-graphic.svg');

console.log('Generating app icons:');
await svgToPng(ICON_SVG, join(IMG_DIR, 'icon.png'), { width: 1024, height: 1024 });
await svgToPng(
  join(SVG_DIR, 'adaptive-foreground.svg'),
  join(IMG_DIR, 'android-icon-foreground.png'),
  { width: 1024, height: 1024 },
);
await svgToPng(
  join(SVG_DIR, 'adaptive-background.svg'),
  join(IMG_DIR, 'android-icon-background.png'),
  { width: 1024, height: 1024 },
);
await svgToPng(
  join(SVG_DIR, 'adaptive-monochrome.svg'),
  join(IMG_DIR, 'android-icon-monochrome.png'),
  { width: 1024, height: 1024 },
);
await svgToPng(ICON_SVG, join(IMG_DIR, 'splash-icon.png'), { width: 200, height: 200 });
await svgToPng(ICON_SVG, join(IMG_DIR, 'favicon.png'), { width: 48, height: 48 });

console.log('Generating store assets:');
await svgToPng(ICON_SVG, join(STORE_DIR, 'app-store-icon-1024.png'), {
  width: 1024,
  height: 1024,
  flatten: ROSE,
});
await svgToPng(ICON_SVG, join(STORE_DIR, 'play-store-icon-512.png'), {
  width: 512,
  height: 512,
});
await svgToPng(FEATURE_SVG, join(STORE_DIR, 'play-feature-graphic-1024x500.png'), {
  width: 1024,
  height: 500,
  flatten: ROSE,
});

console.log('\nDone.');
