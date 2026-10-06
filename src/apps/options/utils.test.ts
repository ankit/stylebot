import type { RunGoogleDriveSyncResponse } from '@stylebot/types';

import { getBackupFilename, runGoogleDriveSync, setAllStyles } from './utils';

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

describe('getBackupFilename', () => {
  it('names the backup after the local date, zero-padded', () => {
    expect(getBackupFilename(new Date(2026, 0, 5, 23, 30))).toBe(
      'stylebot-backup-2026-01-05.json'
    );
  });
});
