// Paint the right background before the bundle loads, to avoid a flash. Runs
// as an external script (not inline) because the extension's CSP blocks
// inline script execution.
(function () {
  var appearance = new URLSearchParams(location.search).get('appearance');
  var dark =
    appearance === 'dark' ||
    (appearance !== 'light' &&
      matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.style.background = dark ? '#1c1e22' : '#fff';
  document
    .querySelector('meta[name="color-scheme"]')
    .setAttribute('content', dark ? 'dark' : 'light');
})();
