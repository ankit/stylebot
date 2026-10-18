import { mockStorage } from './gallery.fixtures';
import { getInstallId } from './install-id';

beforeEach(() => {
  mockStorage();
});

describe('getInstallId', () => {
  it('makes an install id once and keeps it', async () => {
    const installId = await getInstallId();

    expect(installId).toMatch(/^[0-9a-f-]{36}$/);
    expect(await getInstallId()).toBe(installId);
  });
});
