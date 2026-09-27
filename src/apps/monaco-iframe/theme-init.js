// Paint the right background before Monaco loads, to avoid a flash. Runs as
// an external script (not inline) because the extension's CSP blocks inline
// script execution.
if (new URLSearchParams(location.search).get('theme') === 'dark') {
  document.documentElement.classList.add('theme-dark');
}
