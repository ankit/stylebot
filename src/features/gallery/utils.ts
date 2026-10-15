/**
 * The site as the gallery stores it: a bare hostname, without `www.`.
 */
export const toGallerySite = (hostname: string): string =>
  hostname
    .trim()
    .toLowerCase()
    .replace(/^www\./, '');

/**
 * Decodes a data URL into a blob of its type, without fetch, which a page's
 * content security policy can block.
 */
export const dataUrlToBlob = (dataUrl: string): Blob => {
  const [header, data = ''] = dataUrl.split(',');
  const type = header.match(/^data:([^;,]+)/)?.[1] ?? '';
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new Blob([bytes], { type });
};

/**
 * Encodes a blob as a data URL, the form screenshots take in messages.
 */
export const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

/**
 * A short fingerprint of CSS, to tell whether it changed since it was
 * published without keeping a copy. FNV-1a: fast, synchronous and plenty for
 * spotting edits.
 */
export const hashCss = (css: string): string => {
  let hash = 0x811c9dc5;

  for (let i = 0; i < css.length; i++) {
    hash ^= css.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0).toString(16);
};
