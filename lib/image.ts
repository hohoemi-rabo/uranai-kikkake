import * as ImageManipulator from 'expo-image-manipulator';

const MAX_LONG_SIDE = 1024;
const JPEG_QUALITY = 0.8;

export type PreparedImage = {
  base64: string;
  width: number;
  height: number;
  sizeKb: number;
};

export async function prepareForUpload(uri: string): Promise<PreparedImage> {
  // 1. 元画像のサイズ取得(actions 空、base64 不要)
  const meta = await ImageManipulator.manipulateAsync(uri, [], {});

  // 2. 長辺基準のリサイズ仕様を決定(アップスケールはしない)
  const resize =
    meta.width >= meta.height
      ? { width: Math.min(MAX_LONG_SIDE, meta.width) }
      : { height: Math.min(MAX_LONG_SIDE, meta.height) };

  // 3. リサイズ + JPEG + base64
  const out = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize }],
    {
      compress: JPEG_QUALITY,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    },
  );

  if (!out.base64) {
    throw new Error('image manipulator returned no base64');
  }

  // base64 → 元バイト数換算(おおよそ * 3/4)、kB 単位
  const sizeKb = Math.round((out.base64.length * 0.75) / 1024);

  return {
    base64: out.base64,
    width: out.width,
    height: out.height,
    sizeKb,
  };
}
