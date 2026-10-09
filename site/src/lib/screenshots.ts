import type { ImageMetadata } from 'astro';

/**
 * Image props that keep UI text crisp: PNGs stay lossless and other formats
 * are re-encoded at full quality. `data-full` points the lightbox at the
 * original file, and `data-full-width` says how wide it is.
 */
export function crisp(src: ImageMetadata) {
  return {
    format: src.format === 'png' ? 'png' : 'webp',
    quality: 100,
    'data-full': src.src,
    'data-full-width': src.width,
  } as const;
}
