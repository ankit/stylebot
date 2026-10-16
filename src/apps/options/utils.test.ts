import type { RunGoogleDriveSyncResponse } from '@stylebot/types';

import { grantSidePanel, runGoogleDriveSync, setAllStyles } from './utils';

const mockRuntime = (
  sendMessage: () => Promise<RunGoogleDriveSyncResponse | undefined>
) => {
  global.chrome = {
    runtime: { sendMessage },
  } as unknown as typeof chrome;
};

describe('runGoogleDriveSync', () => {
  it('passes a successful response through unchanged', async () => {
    const metadata = {
      id: 'file-id',
      modifiedTime: '2024-01-01T00:00:00.000Z',
      webViewLink: 'https://drive.google.com/view',
      webContentLink: 'https://drive.google.com/download',
    };

    mockRuntime(async () => ({ ok: true, metadata }));

    await expect(runGoogleDriveSync()).resolves.toEqual({
      ok: true,
      metadata,
    });
  });

  it('passes a failure response through unchanged', async () => {
    mockRuntime(async () => ({ ok: false, errorKey: 'sync_error_auth' }));

    await expect(runGoogleDriveSync()).resolves.toEqual({
      ok: false,
      errorKey: 'sync_error_auth',
    });
  });

  it('resolves with an error when the message port closes', async () => {
    mockRuntime(() =>
      Promise.reject(
        new Error('The message port closed before a response was received.')
      )
    );

    await expect(runGoogleDriveSync()).resolves.toEqual({
      ok: false,
      errorKey: 'sync_error_unknown',
      errorDetail: 'The message port closed before a response was received.',
    });
  });

  it('resolves with an error when the service worker answers with nothing', async () => {
    mockRuntime(async () => undefined);

    await expect(runGoogleDriveSync()).resolves.toEqual({
      ok: false,
      errorKey: 'sync_error_unknown',
    });
  });
});

describe('setAllStyles', () => {
  it('resolves true once the background stored the styles', async () => {
    global.chrome = {
      runtime: { sendMessage: async () => ({ ok: true }) },
    } as unknown as typeof chrome;

    await expect(setAllStyles({})).resolves.toBe(true);
  });

  it.each([
    ['the background failed to store them', async () => ({ ok: false })],
    ['the service worker answers with nothing', async () => undefined],
    [
      'the message port closes',
      () => Promise.reject(new Error('The message port closed.')),
    ],
  ])('resolves false when %s', async (_name, sendMessage) => {
    global.chrome = {
      runtime: { sendMessage },
    } as unknown as typeof chrome;

    await expect(setAllStyles({})).resolves.toBe(false);
  });
});

describe('grantSidePanel', () => {
  const mockPermissions = (granted: boolean) => {
    const api = {
      runtime: { sendMessage: jest.fn(), lastError: undefined },
      permissions: {
        request: jest.fn((_permissions, callback) => callback(granted)),
      },
    };

    global.chrome = api as unknown as typeof chrome;
    return api;
  };

  const flush = () => new Promise(resolve => setTimeout(resolve));

  it('asks the background to reload once the permission is granted', async () => {
    const api = mockPermissions(true);

    grantSidePanel();
    await flush();

    expect(api.permissions.request).toBeCalledWith(
      { permissions: ['sidePanel'] },
      expect.any(Function)
    );
    expect(api.runtime.sendMessage).toBeCalledWith({
      name: 'ReloadForSidePanelGrant',
    });
  });

  it('leaves Stylebot running when the permission is refused', async () => {
    const api = mockPermissions(false);

    grantSidePanel();
    await flush();

    expect(api.runtime.sendMessage).not.toBeCalled();
  });
});
