// Both live in the same content-script bundle on the same page, so a plain
// DOM event is enough — no need for chrome.runtime messaging or storage.
const PREVIEW_FONT_EVENT = 'stylebot-reader-preview-font';

export const previewReaderFont = (font: string | null): void => {
  window.dispatchEvent(new CustomEvent(PREVIEW_FONT_EVENT, { detail: font }));
};

export const onPreviewReaderFont = (
  callback: (font: string | null) => void
): void => {
  window.addEventListener(PREVIEW_FONT_EVENT, event => {
    callback((event as CustomEvent<string | null>).detail);
  });
};
