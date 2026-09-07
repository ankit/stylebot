declare global {
  interface Window {
    stylebotReaderUrl: string;
    stylebotReaderOriginalDocumentBodyElements: Array<Node>;
  }
}

/**
 * Records the current URL so a later call can tell whether it's stale.
 */
export const cacheUrl = (): void => {
  window.stylebotReaderUrl = window.location.href;
};

/**
 * Whether the page has navigated since the last cacheUrl() call.
 */
export const didUrlChange = (): boolean => {
  return window.stylebotReaderUrl !== window.location.href;
};

/**
 * Detaches the original page body and remembers its nodes for later restore.
 */
export const cacheDocument = (): void => {
  const nodes = Array.prototype.slice
    .call(document.body.childNodes)
    .filter(node => node.id !== 'stylebot');

  window.stylebotReaderOriginalDocumentBodyElements = nodes;
  nodes.forEach(node => node.remove());
};

/**
 * Re-attaches the original page body nodes cached by cacheDocument().
 */
export const revertToCachedDocument = (): void => {
  if (window.stylebotReaderOriginalDocumentBodyElements) {
    window.stylebotReaderOriginalDocumentBodyElements.forEach(node => {
      document.body.appendChild(node);
    });
  }
};
