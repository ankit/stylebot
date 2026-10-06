import {
  getRatingPromptState,
  getReviewUrl,
  isEligibleForRatingPrompt,
} from './rating-prompt';

const DAY = 24 * 60 * 60 * 1000;
const NOW = 100 * DAY;

const eligible = {
  installTime: NOW - 7 * DAY,
  savedStyles: 3,
  dismissed: false,
  releaseNotificationSeen: true,
};

describe('isEligibleForRatingPrompt', () => {
  it('is eligible after 3 saved styles and 7 days installed', () => {
    expect(isEligibleForRatingPrompt(eligible, NOW)).toBe(true);
  });

  it.each([
    ['fewer than 3 saved styles', { savedStyles: 2 }],
    ['installed under 7 days ago', { installTime: NOW - 7 * DAY + 1 }],
    ['no install time recorded', { installTime: undefined }],
    ['the prompt was dismissed', { dismissed: true }],
    ['the release banner is still showing', { releaseNotificationSeen: false }],
  ])('is not eligible with %s', (_, overrides) => {
    expect(isEligibleForRatingPrompt({ ...eligible, ...overrides }, NOW)).toBe(
      false
    );
  });
});

describe('getReviewUrl', () => {
  it.each([
    {
      browser: 'Chrome',
      ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36',
      url: 'https://chromewebstore.google.com/detail/stylebot/oiaejidbmkiecgbjeifoejpgmdaleoha/reviews',
    },
    {
      browser: 'Edge',
      ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36 Edg/154.0.0.0',
      url: 'https://microsoftedge.microsoft.com/addons/detail/stylebot/mjolbpfednnbebfapicajpifliopnnai',
    },
    {
      browser: 'Firefox',
      ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:150.0) Gecko/20100101 Firefox/150.0',
      url: 'https://addons.mozilla.org/firefox/addon/stylebot-web/reviews/',
    },
    {
      browser: 'Safari',
      ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15',
      url: null,
    },
  ])('points $browser at its store', ({ ua, url }) => {
    expect(getReviewUrl(ua)).toBe(url);
  });
});

describe('getRatingPromptState', () => {
  it('counts only saved styles that have css', async () => {
    const store: Record<string, unknown> = {
      'install-time': 42,
      styles: {
        'a.com': { css: 'a {}' },
        'b.com': { css: '' },
        'c.com': { css: '', profiles: { dark: { name: 'Dark', css: 'b {}' } } },
      },
      'notification~rating-prompt': true,
    };

    global.chrome = {
      runtime: { getManifest: () => ({ version: '3.2.0' }) },
      storage: {
        local: {
          get: jest.fn(async (keys: string | Array<string>) =>
            Object.fromEntries([keys].flat().map(key => [key, store[key]]))
          ),
        },
      },
    } as unknown as typeof chrome;

    await expect(getRatingPromptState()).resolves.toEqual({
      installTime: 42,
      savedStyles: 2,
      dismissed: true,
      releaseNotificationSeen: false,
    });
  });
});
