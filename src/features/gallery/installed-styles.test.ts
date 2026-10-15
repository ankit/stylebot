import { mockStorage } from './gallery.fixtures';
import {
  getInstallId,
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

    expect(await getInstalledStyleIds()).toEqual(new Set(['abc']));
  });
});
