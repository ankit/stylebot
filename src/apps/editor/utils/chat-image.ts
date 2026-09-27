import type { ChatImage } from '@stylebot/types';

// Longest edge the providers look at in detail; larger only costs more.
const MAX_EDGE = 1568;
const JPEG_QUALITY = 0.88;

/**
 * Decodes an image file (pasted, dropped or picked), scales it down to what
 * the model reads, and re-encodes it: PNG while that stays small, since
 * screenshots of text blur as JPEG, and JPEG past that.
 */
export const readChatImage = async (
  file: Blob,
  name = ''
): Promise<ChatImage> => {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);

  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Canvas unavailable');
  }

  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const png = canvas.toDataURL('image/png');
  const useJpeg = png.length > 1_000_000;
  const dataUrl = useJpeg ? canvas.toDataURL('image/jpeg', JPEG_QUALITY) : png;

  return {
    dataUrl,
    mediaType: useJpeg ? 'image/jpeg' : 'image/png',
    name,
    size: Math.round(((dataUrl.length - dataUrl.indexOf(',') - 1) * 3) / 4),
  };
};

/**
 * The first image among dropped or pasted items, if any.
 */
export const getImageFile = (data: DataTransfer | null): File | null =>
  Array.from(data?.files ?? []).find(file => file.type.startsWith('image/')) ??
  null;
