jest.mock('@stylebot/sync', () => ({
  runGoogleDriveSync: jest.fn(),
}));
jest.mock('./migrations', () => ({
  runMigrations: jest.fn(async () => undefined),
}));

import { RunGoogleDriveSync } from './messages';
import { runGoogleDriveSync } from '@stylebot/sync';
import { runMigrations } from './migrations';

const mockedRunMigrations = runMigrations as jest.MockedFunction<
  typeof runMigrations
>;

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

  it('runs interactively unless the sender opts out', async () => {
    mockedRunSync.mockResolvedValue({ ok: false, errorKey: 'sync_error_auth' });

    await RunGoogleDriveSync({ name: 'RunGoogleDriveSync' }, jest.fn());
    await RunGoogleDriveSync(
      { name: 'RunGoogleDriveSync', interactive: false },
      jest.fn()
    );

    expect(mockedRunSync.mock.calls[0][1]).toEqual({ interactive: true });
    expect(mockedRunSync.mock.calls[1][1]).toEqual({ interactive: false });
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

  it('waits for the migrations before syncing', async () => {
    let finish = (): void => undefined;
    mockedRunMigrations.mockReturnValue(
      new Promise<void>(resolve => (finish = resolve))
    );
    mockedRunSync.mockResolvedValue({ ok: false, errorKey: 'sync_error_auth' });

    const answered = RunGoogleDriveSync(
      { name: 'RunGoogleDriveSync' },
      jest.fn()
    );
    await Promise.resolve();
    expect(mockedRunSync).not.toBeCalled();

    finish();
    await answered;
    expect(mockedRunSync).toBeCalledTimes(1);
  });
});
