import { RunGoogleDriveSyncResponse } from '@stylebot/types';

import { runGoogleDriveSync } from '../utils';

type SendMessage = (
  message: unknown,
  callback: (response?: RunGoogleDriveSyncResponse) => void
) => void;

const mockRuntime = (sendMessage: SendMessage, lastError?: { message: string }) => {
  global.chrome = {
    runtime: { sendMessage, lastError },
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

    mockRuntime((_message, callback) => callback({ ok: true, metadata }));

    await expect(runGoogleDriveSync()).resolves.toEqual({
      ok: true,
      metadata,
    });
  });

  it('passes a failure response through unchanged', async () => {
    mockRuntime((_message, callback) =>
      callback({ ok: false, errorKey: 'sync_error_auth' })
    );

    await expect(runGoogleDriveSync()).resolves.toEqual({
      ok: false,
      errorKey: 'sync_error_auth',
    });
  });

  it('resolves with an error when the service worker answers with nothing', async () => {
    mockRuntime(
      (_message, callback) => callback(undefined),
      { message: 'The message port closed before a response was received.' }
    );

    await expect(runGoogleDriveSync()).resolves.toEqual({
      ok: false,
      errorKey: 'sync_error_unknown',
      errorDetail: 'The message port closed before a response was received.',
    });
  });

  it('resolves rather than hanging when there is no response and no lastError', async () => {
    mockRuntime((_message, callback) => callback(undefined));

    await expect(runGoogleDriveSync()).resolves.toEqual({
      ok: false,
      errorKey: 'sync_error_unknown',
      errorDetail: undefined,
    });
  });
});
