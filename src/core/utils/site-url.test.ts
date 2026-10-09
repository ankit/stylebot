import { getSiteUrl } from './site-url';

jest.mock('@stylebot/i18n', () => ({ t: () => 'pt-BR' }));

describe('getSiteUrl', () => {
  it('prefixes the path with the UI language', () => {
    expect(getSiteUrl('/manual')).toBe('https://stylebot.dev/pt-br/manual');
    expect(getSiteUrl('/releases/4.0', 'zh-TW')).toBe(
      'https://stylebot.dev/zh-tw/releases/4.0'
    );
  });

  it('uses the English site for English and untranslated languages', () => {
    expect(getSiteUrl('/welcome', 'en')).toBe('https://stylebot.dev/welcome');
    expect(getSiteUrl('/welcome', 'en-GB')).toBe(
      'https://stylebot.dev/welcome'
    );
    expect(getSiteUrl('/goodbye', 'nl')).toBe('https://stylebot.dev/goodbye');
  });
});
