/**
 * The site as the gallery stores it: a bare hostname, without `www.`.
 */
export const toGallerySite = (hostname: string): string =>
  hostname
    .trim()
    .toLowerCase()
    .replace(/^www\./, '');

const PRIVATE_SUFFIX =
  /\.(local|localhost|internal|intranet|lan|home|corp|arpa|test|example|invalid)$/;

/**
 * Whether a page is on a public website, rather than a local or internal
 * address the gallery has no business hearing about: an IP, a single-label
 * name, a reserved or intranet suffix, or a non-default port.
 */
export const isPublicSite = ({ protocol, hostname, port }: URL): boolean =>
  /^https?:$/.test(protocol) &&
  !port &&
  hostname.includes('.') &&
  !hostname.startsWith('[') &&
  !/^\d+(\.\d+){3}$/.test(hostname) &&
  !PRIVATE_SUFFIX.test(hostname.replace(/\.$/, ''));

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
 * spotting edits. Whitespace around the CSS doesn't count: removing an
 * empty last rule takes the trailing newline with it.
 */
export const hashCss = (css: string): string => {
  const trimmed = css.trim();
  let hash = 0x811c9dc5;

  for (let i = 0; i < trimmed.length; i++) {
    hash ^= trimmed.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0).toString(16);
};
