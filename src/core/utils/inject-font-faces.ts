/**
 * Registers Stylebot's fonts on the page's document, since browsers ignore
 * font-face rules inside a shadow root. Reads the same fonts.css the
 * extension pages use, pointing its files at the extension.
 */
export const injectFontFaces = async (): Promise<void> => {
  if (document.getElementById('stylebot-editor-fonts')) {
    return;
  }

  const styleEl = document.createElement('style');
  styleEl.setAttribute('id', 'stylebot-editor-fonts');
  (document.head || document.documentElement).appendChild(styleEl);

  const css = await fetch(chrome.runtime.getURL('fonts/fonts.css')).then(
    response => response.text()
  );

  styleEl.textContent = css.replace(
    /url\('([^']+)'\)/g,
    (_, file: string) => `url('${chrome.runtime.getURL(`fonts/${file}`)}')`
  );
};
