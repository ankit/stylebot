declare global {
  interface Window {
    stylebotReaderUrl: string;
    stylebotReaderOriginalDocumentBodyElements: Array<Node>;
  }
}

export const cacheUrl = (): void => {
  window.stylebotReaderUrl = window.location.href;
};

export const didUrlChange = (): boolean => {
  return window.stylebotReaderUrl !== window.location.href;
};

export const cacheDocument = (): void => {
  const nodes = Array.prototype.slice
    .call(document.body.childNodes)
    .filter(node => node.id !== 'stylebot');

  window.stylebotReaderOriginalDocumentBodyElements = nodes;
  nodes.forEach(node => node.remove());
};

export const revertToCachedDocument = (): void => {
  if (window.stylebotReaderOriginalDocumentBodyElements) {
    window.stylebotReaderOriginalDocumentBodyElements.forEach(node => {
      document.body.appendChild(node);
    });
  }
};
