// String builder (not a real .css file) so it can be injected synchronously
// at document_start, ahead of the browser's first paint.

// Jade/teal accent for the "title" line — swap to retint the animation.
const ACCENT = '#2f9e8f';

export const LOADER_ART_ID = 'stylebot-reader-loading-art';

export type LoaderColors = {
  background: string;
  foreground: string;
};

// Build the loading-screen CSS for the given theme colors and line count.
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
    // Paint body too — it parses after document_start and can be opaque.
    `html, body { background: ${background} !important; } ` +
    'body { border: 0 !important; box-shadow: none !important; } ' +
    'body *:not(#stylebot) { display: none; }' +
    `#${LOADER_ART_ID} {` +
    '  position: fixed; inset: 0; margin: auto;' +
    '  width: 130px; height: -moz-fit-content; height: fit-content;' +
    '  display: flex; flex-direction: column; gap: 8px;' +
    '  z-index: 2147483647; pointer-events: none; opacity: 0;' +
    // Fade in only after a delay, so fast loads show nothing.
    '  animation: stylebot-reader-fade-in 0.25s ease-out 0.6s forwards;' +
    '}' +
    `#${LOADER_ART_ID} > i {` +
    '  display: block; height: 7px; border-radius: 3px;' +
    `  background: ${foreground}; opacity: 0.45;` +
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
