export type Browser = 'chrome' | 'firefox' | 'edge';

type Store = { name: string; href: string; reviews?: string };

export const STORES: Record<Browser, Store> = {
  chrome: {
    name: 'Chrome',
    href: 'https://chromewebstore.google.com/detail/stylebot/oiaejidbmkiecgbjeifoejpgmdaleoha',
    reviews:
      'https://chromewebstore.google.com/detail/stylebot/oiaejidbmkiecgbjeifoejpgmdaleoha/reviews',
  },
  firefox: {
    name: 'Firefox',
    href: 'https://addons.mozilla.org/firefox/addon/stylebot-web/',
    reviews: 'https://addons.mozilla.org/firefox/addon/stylebot-web/reviews/',
  },
  edge: {
    name: 'Edge',
    href: 'https://microsoftedge.microsoft.com/addons/detail/stylebot/mjolbpfednnbebfapicajpifliopnnai',
  },
};

export const BROWSERS = Object.keys(STORES) as Browser[];

export const API_KEYS = {
  claude: 'https://console.anthropic.com/settings/keys',
  openai: 'https://platform.openai.com/api-keys',
  gemini: 'https://aistudio.google.com/api-keys',
};

export const LINKS = {
  github: 'https://github.com/ankit/stylebot',
  issues: 'https://github.com/ankit/stylebot/issues',
  changelog: 'https://github.com/ankit/stylebot/blob/v4/CHANGELOG.md',
  donate: 'https://ko-fi.com/stylebot',
  manual: '/manual',
  privacy: '/privacy',
  author: 'https://ankitahuja.com',
  feedbackEmail: 'stylebot+ahuja.ankit@gmail.com',
};
