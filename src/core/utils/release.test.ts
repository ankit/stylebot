import { getGoodbyeUrl, hasReleasePage, isMajorUpdate } from './release';

jest.mock('@stylebot/i18n', () => ({ t: () => 'de' }));

describe('getGoodbyeUrl', () => {
  it('passes the extension version to the goodbye page', () => {
    global.chrome = {
      runtime: { getManifest: () => ({ version: '4.1.0' }) },
    } as unknown as typeof chrome;

    expect(getGoodbyeUrl()).toBe(
      'https://stylebot.dev/de/goodbye?version=4.1.0'
    );
  });
});

describe('isMajorUpdate', () => {
  it('is true when the major version goes up', () => {
    expect(isMajorUpdate('3.2.4', '4.0.0')).toBe(true);
    expect(isMajorUpdate('3.2', '4.0')).toBe(true);
  });

  it('is false for minor and patch updates', () => {
    expect(isMajorUpdate('4.0.0', '4.0.1')).toBe(false);
    expect(isMajorUpdate('4.0.0', '4.1.0')).toBe(false);
  });

  it('is false for the same version and for a downgrade', () => {
    expect(isMajorUpdate('4.0.0', '4.0.0')).toBe(false);
    expect(isMajorUpdate('4.0.0', '3.2.4')).toBe(false);
  });

  it('is false when the previous version is missing or unparseable', () => {
    expect(isMajorUpdate(undefined, '4.0.0')).toBe(false);
    expect(isMajorUpdate('', '4.0.0')).toBe(false);
    expect(isMajorUpdate('garbage', '4.0.0')).toBe(false);
    expect(isMajorUpdate('v3.2.4', '4.0.0')).toBe(false);
  });
});

describe('hasReleasePage', () => {
  const setVersion = (version: string) => {
    global.chrome = {
      runtime: { getManifest: () => ({ version }) },
    } as unknown as typeof chrome;
  };

  it('is true for a release with a page on stylebot.dev', () => {
    setVersion('4.1.0');
    expect(hasReleasePage()).toBe(true);
  });

  it('is false for a release without one', () => {
    setVersion('4.2.0');
    expect(hasReleasePage()).toBe(false);
  });
});
