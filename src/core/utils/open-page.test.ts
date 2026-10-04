import { canOpenShortcutsPage } from './open-page';

describe('canOpenShortcutsPage', () => {
  const userAgent = navigator.userAgent;

  const setUserAgent = (value: string) =>
    Object.defineProperty(navigator, 'userAgent', {
      value,
      configurable: true,
    });

  afterEach(() => setUserAgent(userAgent));

  it.each([
    {
      browser: 'Chrome',
      expected: true,
      ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36',
    },
    {
      browser: 'Edge',
      expected: true,
      ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36 Edg/154.0.0.0',
    },
    {
      browser: 'Firefox',
      expected: true,
      ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:150.0) Gecko/20100101 Firefox/150.0',
    },
    {
      browser: 'Safari',
      expected: false,
      ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15',
    },
  ])('is $expected in $browser', ({ expected, ua }) => {
    setUserAgent(ua);
    expect(canOpenShortcutsPage()).toBe(expected);
  });
});
