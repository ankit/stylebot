jest.mock('@stylebot/sync', () => ({
  runGoogleDriveSync: jest.fn(),
}));

import { RunGoogleDriveSync } from '../messages';
import { runGoogleDriveSync } from '@stylebot/sync';

const mockedRunSync = runGoogleDriveSync as jest.MockedFunction<
  typeof runGoogleDriveSync
>;

describe('RunGoogleDriveSync', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('answers with the sync result', async () => {
    const metadata = {
      id: 'file-id',
      modifiedTime: '2024-01-01T00:00:00.000Z',
      webViewLink: 'https://drive.google.com/view',
      webContentLink: 'https://drive.google.com/download',
    };

    mockedRunSync.mockResolvedValue({ ok: true, metadata });
    const sendResponse = jest.fn();

    await RunGoogleDriveSync({ name: 'RunGoogleDriveSync' }, sendResponse);

    expect(sendResponse).toBeCalledTimes(1);
    expect(sendResponse).toBeCalledWith({ ok: true, metadata });
  });

  it('answers with the failure result rather than throwing', async () => {
    mockedRunSync.mockResolvedValue({
      ok: false,
      errorKey: 'sync_error_auth',
      errorDetail: 'Authorization failure',
    });

    const sendResponse = jest.fn();

    await RunGoogleDriveSync({ name: 'RunGoogleDriveSync' }, sendResponse);

    expect(sendResponse).toBeCalledTimes(1);
    expect(sendResponse).toBeCalledWith({
      ok: false,
      errorKey: 'sync_error_auth',
      errorDetail: 'Authorization failure',
    });
  });

  it('still answers when the sync rejects, so the caller is never left waiting', async () => {
    mockedRunSync.mockRejectedValue(new Error('unexpected'));
    const sendResponse = jest.fn();

    await RunGoogleDriveSync({ name: 'RunGoogleDriveSync' }, sendResponse);

    expect(sendResponse).toBeCalledTimes(1);
    expect(sendResponse).toBeCalledWith({
      ok: false,
      errorKey: 'sync_error_unknown',
      errorDetail: 'unexpected',
    });
  });
});
