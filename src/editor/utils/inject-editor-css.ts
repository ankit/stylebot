export default (): void => {
  const el = document.getElementById('stylebot-editor-css');

  if (!el) {
    const root = document.getElementById('stylebot');
    const url = chrome.extension.getURL('editor/index.css');

    if (root) {
      fetch(url, { method: 'GET' })
        .then(response => response.text())
        .then(css => {
          const styleEl = document.createElement('style');
          styleEl.setAttribute('id', 'stylebot-editor-css');
          styleEl.innerHTML = css;
          root.shadowRoot?.appendChild(styleEl);
        });
    }
  }
};
