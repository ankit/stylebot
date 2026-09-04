const HIDE_PAGE_STYLE_ID = 'stylebot-hide-page';

export const hidePage = (): void => {
  const style = document.createElement('style');

  style.setAttribute('id', HIDE_PAGE_STYLE_ID);
  style.appendChild(
    document.createTextNode('html { visibility: hidden !important; }')
  );

  document.documentElement.appendChild(style);
};

// No-op if the page was never hidden, so this is safe to call unconditionally.
export const revealPage = (): void => {
  const style = document.getElementById(HIDE_PAGE_STYLE_ID);

  if (style) {
    style.remove();
  }
};
