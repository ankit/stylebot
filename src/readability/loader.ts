/**
 * Hide document content until reader is ready
 * todo: optimize performance and UX when loading stylebot reader
 * currently, sometimes the page flashes for the reader content is loaded.
 * or a white screen appears for a prolonged period, especially for slower websites.
 */
export const showLoader = (): void => {
  const style = document.createElement('style');

  style.type = 'text/css';
  style.setAttribute('id', 'stylebot-reader-loading');
  style.appendChild(
    document.createTextNode('body *:not(#stylebot) { display: none; }')
  );

  document.documentElement.appendChild(style);
};

export const hideLoader = (): void => {
  document.getElementById('stylebot-reader-loading')?.remove();
};
