import { isAndroid } from './is-android';

describe('isAndroid', () => {
  const userAgent = navigator.userAgent;

  const setUserAgent = (value: string) =>
    Object.defineProperty(navigator, 'userAgent', {
      value,
      configurable: true,
    });

  afterEach(() => setUserAgent(userAgent));

  it.each([
    {
      browser: 'Firefox for Android',
      expected: true,
      ua: 'Mozilla/5.0 (Android 15; Mobile; rv:158.0) Gecko/158.0 Firefox/158.0',
    },
    {
      browser: 'Firefox on Windows',
      expected: false,
      ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:158.0) Gecko/20100101 Firefox/158.0',
    },
    {
      browser: 'Chrome on macOS',
      expected: false,
      ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36',
    },
  ])('is $expected on $browser', ({ ua, expected }) => {
    setUserAgent(ua);
    expect(isAndroid()).toBe(expected);
  });
});
