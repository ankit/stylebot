import { SCREENSHOT_MAX_BYTES } from './config';
import { dataUrlToBlob } from './utils';
import { galleryApiError } from './request';

// A 2x capture of a 1440px-wide window, kept sharp on high-density screens.
const MAX_WIDTH = 2880;
const MIN_WIDTH = 320;
const SCALE_STEP = 0.85;
// Most pages fit at QUALITY; the rest search down to MIN_QUALITY before shrinking.
const QUALITY = 0.85;
const MIN_QUALITY = 0.7;
const QUALITY_SEARCH_STEPS = 2;

const WEBP = 'image/webp';
const JPEG = 'image/jpeg';

/**
 * WebP where the browser can encode it, else JPEG. Safari can't, and hands
 * back a PNG when asked for one.
 */
const getEncodedType = async (): Promise<string> => {
  const canvas = new OffscreenCanvas(1, 1);
  // convertToBlob throws on a canvas without a rendering context.
  canvas.getContext('2d');
  const probe = await canvas.convertToBlob({ type: WEBP });

  return probe.type === WEBP ? WEBP : JPEG;
};

/**
 * Draws a captured tab at a width, smoothed so text stays sharp scaled down.
 */
const drawAt = (source: ImageBitmap, width: number): OffscreenCanvas => {
  const height = Math.round((source.height * width) / source.width);
  const canvas = new OffscreenCanvas(width, height);
  const context = canvas.getContext('2d');

  if (context) {
    context.imageSmoothingQuality = 'high';
    context.drawImage(source, 0, 0, width, height);
  }

  return canvas;
};

/**
 * A canvas encoded at QUALITY, or the best quality down to MIN_QUALITY that
 * fits the limit, or null when none does.
 */
const encodeToFit = async (
  canvas: OffscreenCanvas,
  type: string
): Promise<Blob | null> => {
  const encode = (quality: number) => canvas.convertToBlob({ type, quality });
  const fits = (blob: Blob) => blob.size <= SCREENSHOT_MAX_BYTES;
  const best = await encode(QUALITY);

  if (fits(best)) {
    return best;
  }

  let fitting = await encode(MIN_QUALITY);

  if (!fits(fitting)) {
    return null;
  }

  let low = MIN_QUALITY;
  let high = QUALITY;

  for (let step = 0; step < QUALITY_SEARCH_STEPS; step++) {
    const quality = (low + high) / 2;
    const blob = await encode(quality);

    if (fits(blob)) {
      fitting = blob;
      low = quality;
    } else {
      high = quality;
    }
  }

  return fitting;
};

/**
 * Scales and compresses a captured tab until it fits the gallery's 1 MB
 * screenshot limit, usually in one encode. Quality goes down a little before
 * resolution does.
 */
export const compressScreenshot = async (dataUrl: string): Promise<Blob> => {
  const [source, type] = await Promise.all([
    createImageBitmap(dataUrlToBlob(dataUrl)),
    getEncodedType(),
  ]);
  let width = Math.min(source.width, MAX_WIDTH);

  while (width >= MIN_WIDTH) {
    const blob = await encodeToFit(drawAt(source, width), type);

    if (blob) {
      return blob;
    }

    width = Math.round(width * SCALE_STEP);
  }

  throw galleryApiError('Screenshot too large', 413);
};
