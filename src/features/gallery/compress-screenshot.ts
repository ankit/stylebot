import { SCREENSHOT_MAX_BYTES } from './config';
import { dataUrlToBlob } from './utils';
import { galleryApiError } from './request';

// A 2x capture of a 1440px-wide window, kept sharp on high-density screens.
const MAX_WIDTH = 2880;
const MIN_WIDTH = 320;
const SCALE_STEP = 0.85;
// Tried in turn at each size, so detail goes before resolution does.
const QUALITIES = [0.92, 0.85, 0.75];

// Safari can't encode WebP, and hands back a PNG when asked for one.
const TYPES = ['image/webp', 'image/jpeg'];

/**
 * Scales and compresses a captured tab until it fits the gallery's 1 MB
 * screenshot limit, as WebP where the browser can encode it, else JPEG.
 */
export const compressScreenshot = async (dataUrl: string): Promise<Blob> => {
  const source = await createImageBitmap(dataUrlToBlob(dataUrl));
  let width = Math.min(source.width, MAX_WIDTH);

  while (width >= MIN_WIDTH) {
    const height = Math.round((source.height * width) / source.width);
    const canvas = new OffscreenCanvas(width, height);
    canvas.getContext('2d')?.drawImage(source, 0, 0, width, height);

    for (const type of TYPES) {
      for (const quality of QUALITIES) {
        const blob = await canvas.convertToBlob({ type, quality });

        if (blob.type !== type) {
          break;
        }

        if (blob.size <= SCREENSHOT_MAX_BYTES) {
          return blob;
        }
      }
    }

    width = Math.round(width * SCALE_STEP);
  }

  throw galleryApiError('Screenshot too large', 413);
};
