// Drive sign-in in a tab: a redirect rule reroutes Google's loopback redirect
// to this page, which has to be web accessible for it.
const signInPage = {
  resources: ['google-sign-in/index.html'],
  matches: ['https://accounts.google.com/*', 'http://127.0.0.1/*'],
};

module.exports = { signInPage };
