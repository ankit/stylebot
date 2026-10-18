import { mockStorage } from './gallery.fixtures';
import {
  getInstallId,
  getInstalledProfileNames,
  getInstalledStyleForProfile,
  getInstalledStyleIds,
  rememberInstalledStyle,
} from './installed-styles';

beforeEach(() => {
  mockStorage();
});

describe('installed styles', () => {
  it('makes an install id once and keeps it', async () => {
    const installId = await getInstallId();

    expect(installId).toMatch(/^[0-9a-f-]{36}$/);
    expect(await getInstallId()).toBe(installId);
  });

  it('remembers which gallery styles are installed', async () => {
    await rememberInstalledStyle('abc', {
      url: 'github.com',
      profileId: 'p1',
      version: 1,
      group: 'github.com',
      slug: 'night',
    });

    expect(
      await getInstalledStyleIds({
        'github.com': {
          css: '',
          enabled: true,
          readability: false,
          modifiedTime: '',
          profiles: { p1: { name: 'Night' } },
        },
      })
    ).toEqual(new Set(['abc']));
    expect(await getInstalledStyleForProfile('github.com', 'p1')).toEqual(
      expect.objectContaining({ group: 'github.com', slug: 'night' })
    );
  });

  it('forgets an install once its profile is removed', async () => {
    await rememberInstalledStyle('abc', {
      url: 'github.com',
      profileId: 'p1',
      version: 1,
      group: 'github.com',
      slug: 'night',
    });

    expect(
      await getInstalledStyleIds({
        'github.com': {
          css: '',
          enabled: true,
          readability: false,
          modifiedTime: '',
          profiles: { default: { name: '' } },
        },
      })
    ).toEqual(new Set());
  });

  it('names the profiles requested styles are installed as', async () => {
    await rememberInstalledStyle('abc', {
      url: 'github.com',
      profileId: 'p1',
      version: 1,
      group: 'github.com',
      slug: 'night',
    });
    await rememberInstalledStyle('gone', {
      url: 'github.com',
      profileId: 'p2',
      version: 1,
      group: 'github.com',
      slug: 'gone',
    });

    expect(
      await getInstalledProfileNames(
        {
          'github.com': {
            css: '',
            enabled: true,
            readability: false,
            modifiedTime: '',
            profiles: { p1: { name: 'Night' } },
          },
        },
        ['abc', 'gone', 'unknown']
      )
    ).toEqual({ abc: 'Night' });
  });
});
