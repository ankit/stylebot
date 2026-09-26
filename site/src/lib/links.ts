export const STORES = {
  chrome: {
    name: 'Chrome',
    href: 'https://chromewebstore.google.com/detail/stylebot/oiaejidbmkiecgbjeifoejpgmdaleoha',
  },
  firefox: {
    name: 'Firefox',
    href: 'https://addons.mozilla.org/firefox/addon/stylebot-web/',
  },
  edge: {
    name: 'Edge',
    href: 'https://microsoftedge.microsoft.com/addons/detail/stylebot/mjolbpfednnbebfapicajpifliopnnai',
  },
};

export type Browser = keyof typeof STORES;

export const BROWSERS = Object.keys(STORES) as Browser[];

export const LINKS = {
  github: 'https://github.com/ankit/stylebot',
  issues: 'https://github.com/ankit/stylebot/issues',
  changelog: 'https://github.com/ankit/stylebot/blob/v4/CHANGELOG.md',
  donate: 'https://ko-fi.com/stylebot',
  manual: '/manual',
  author: 'https://ankitahuja.com',
  feedbackEmail: 'stylebot+ahuja.ankit@gmail.com',
};
