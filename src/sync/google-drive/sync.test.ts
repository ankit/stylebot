import { GoogleDriveSyncMetadata } from '@stylebot/types';

import { runGoogleDriveSync } from './sync';
import {
  getSyncFileMetadata,
  downloadSyncFile,
  writeSyncFile,
} from './sync-file';

jest.mock('./get-access-token', () => ({
  __esModule: true,
  default: jest.fn(async () => 'access-token'),
}));

jest.mock('./sync-file', () => ({
  getSyncFileMetadata: jest.fn(),
  downloadSyncFile: jest.fn(),
  writeSyncFile: jest.fn(),
}));

const LAST_SYNC_TIME = '2021-01-01T00:00:00.000+00:00';
const STYLES_MODIFIED_TIME = '2021-06-01T00:00:00.000+00:00';

const remoteSyncMetadata: GoogleDriveSyncMetadata = {
  id: 'sync-file-id',
  modifiedTime: LAST_SYNC_TIME,
  webViewLink: 'https://drive.google.com/view',
  webContentLink: 'https://drive.google.com/download',
};

describe('runGoogleDriveSync', () => {
  let store: Record<string, unknown>;

  beforeEach(() => {
    jest.clearAllMocks();

    store = {
      styles: {
        'google.com': {
          css: 'body { color: red; }',
          enabled: true,
          readability: false,
          modifiedTime: STYLES_MODIFIED_TIME,
        },
      },
      'google-drive-sync': remoteSyncMetadata,
      // The shape the styles-metadata migration used to write.
      'styles-metadata': STYLES_MODIFIED_TIME,
    };

    global.chrome = {
      storage: {
        local: {
          get: jest.fn(
            (
              key: string,
              callback: (items: Record<string, unknown>) => void
            ) => {
              setTimeout(() => callback({ [key]: store[key] }), 0);
            }
          ),
          set: jest.fn(
            (items: Record<string, unknown>, callback?: () => void) => {
              setTimeout(() => {
                Object.assign(store, items);
                callback?.();
              }, 0);
            }
          ),
        },
      },
    } as unknown as typeof chrome;

    (getSyncFileMetadata as jest.Mock).mockResolvedValue(remoteSyncMetadata);
    (writeSyncFile as jest.Mock).mockResolvedValue({
      ...remoteSyncMetadata,
      modifiedTime: '2021-06-02T00:00:00.000+00:00',
    });
  });

  it('uploads local styles when styles-metadata is a legacy bare string', async () => {
    await runGoogleDriveSync();

    expect(writeSyncFile).toHaveBeenCalledWith(
      'access-token',
      expect.anything(),
      remoteSyncMetadata.id
    );
    expect(downloadSyncFile).not.toHaveBeenCalled();
  });
});
