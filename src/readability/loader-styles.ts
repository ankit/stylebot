// Styles for the reader loading screen. Kept as a string builder (not a real
// .css file) so it can be injected synchronously at document_start — the themed
// background must paint before the browser's first frame, which rules out
// fetching an extracted stylesheet at runtime.

// Jade/teal ink accent for the "title" line — stands apart from the warm paper
// themes. Swap this one constant to retint the animation.
const ACCENT = '#2f9e8f';

export const LOADER_ART_ID = 'stylebot-reader-loading-art';

export type LoaderColors = {
  background: string;
  foreground: string;
};

/**
 * Build the loading-screen CSS for the given theme colors. `lineCount` drives
 * the staggered per-line animation delays so the "written lines" ripple stays
 * in sync with however many skeleton lines the DOM renders.
 */
export const loaderCss = (
  { background, foreground }: LoaderColors,
  lineCount: number
): string => {
  // Stagger the ripple: title first, then each paragraph line after it.
  const lineDelays = Array.from(
    { length: lineCount },
    (_, i) =>
      `#${LOADER_ART_ID} > i:nth-child(${i + 1}) { animation-delay: ${i * 0.14}s; }`
  ).join(' ');

  return (
    // Also paint body: the page's own <body> parses after document_start and
    // may carry an opaque (often white) background that would otherwise paint
    // over the themed html background before the reader mounts.
    `html, body { background: ${background} !important; } ` +
    'body { border: 0 !important; box-shadow: none !important; } ' +
    'body *:not(#stylebot) { display: none; }' +
    // The loader art lives directly under <html> (outside body), so it's
    // unaffected by the body-child hide rule above.
    `#${LOADER_ART_ID} {` +
    '  position: fixed; inset: 0; margin: auto;' +
    '  width: 130px; height: -moz-fit-content; height: fit-content;' +
    '  display: flex; flex-direction: column; gap: 8px;' +
    '  z-index: 2147483647; pointer-events: none; opacity: 0;' +
    // Only fade the whole skeleton in after a delay — a reader that mounts
    // quickly removes the loader first, so fast loads show nothing and only
    // real waits (e.g. deferred lazy-image hosts) reveal the animation.
    '  animation: stylebot-reader-fade-in 0.25s ease-out 0.6s forwards;' +
    '}' +
    `#${LOADER_ART_ID} > i {` +
    '  display: block; height: 7px; border-radius: 3px;' +
    `  background: ${foreground}; opacity: 0.45;` +
    // Each line grows from the left ("written") then clears, staggered per line
    // below, so the article appears to be laid out into clean lines.
    '  transform: scaleX(0); transform-origin: left center;' +
    '  animation: stylebot-reader-write 1.8s ease-in-out infinite;' +
    '}' +
    `#${LOADER_ART_ID} > i.title {` +
    `  height: 9px; background: ${ACCENT}; opacity: 0.9; margin-bottom: 4px;` +
    '}' +
    lineDelays +
    '@keyframes stylebot-reader-write { 0%,100% { transform: scaleX(0); } 30%,70% { transform: scaleX(1); } }' +
    '@keyframes stylebot-reader-fade-in { to { opacity: 1; } }'
  );
};
