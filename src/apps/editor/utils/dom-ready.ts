/**
 * Runs fn once the page has parsed its body, which the editor and the
 * reader mount into. Content scripts start earlier, so no message is missed.
 */
export const whenDomReady = (fn: () => void): void => {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn, { once: true });
  } else {
    fn();
  }
};
