import fetchMock from 'jest-fetch-mock';

import {
  getSyncFileMetadata,
  writeSyncFile,
  downloadSyncFile,
} from '../sync-file';
import { isSyncError } from '../../errors';

const ACCESS_TOKEN = 'access-token';

const requests = () =>
  fetchMock.mock.calls.map(([url, init]) => ({
    url: String(url),
    method: (init as RequestInit | undefined)?.method,
  }));

const searchRequests = () =>
  requests().filter(r => r.method === 'GET' && r.url.includes('?q='));

describe('getSyncFileMetadata', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it('looks for the backup folder excluding trashed folders', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ files: [] }));

    await getSyncFileMetadata(ACCESS_TOKEN);

    const [folderSearch] = searchRequests();
    const query = new URL(folderSearch.url).searchParams.get('q');

    expect(query).toContain("name = 'stylebot'");
    expect(query).toContain('application/vnd.google-apps.folder');
    expect(query).toContain('trashed = false');
    expect(new URL(folderSearch.url).searchParams.get('spaces')).toBe('drive');
  });

  it('returns null without searching for the file when no folder exists', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ files: [] }));

    await expect(getSyncFileMetadata(ACCESS_TOKEN)).resolves.toBeNull();
    expect(fetchMock).toBeCalledTimes(1);
  });

  it('scopes the file search to the backup folder and untrashed files', async () => {
    fetchMock
      .mockResponseOnce(JSON.stringify({ files: [{ id: 'folder-id' }] }))
      .mockResponseOnce(JSON.stringify({ files: [] }));

    await getSyncFileMetadata(ACCESS_TOKEN);

    const [, fileSearch] = searchRequests();
    const query = new URL(fileSearch.url).searchParams.get('q');

    expect(query).toContain("name = 'stylebot_v3_backup.json'");
    expect(query).toContain("'folder-id' in parents");
    expect(query).toContain('trashed = false');
  });

  it('picks the most recently modified match rather than the first', async () => {
    fetchMock
      .mockResponseOnce(JSON.stringify({ files: [{ id: 'folder-id' }] }))
      .mockResponseOnce(
        JSON.stringify({
          files: [
            { id: 'older', modifiedTime: '2024-01-01T00:00:00.000Z' },
            { id: 'newer', modifiedTime: '2024-06-01T00:00:00.000Z' },
          ],
        })
      )
      .mockResponseOnce(
        JSON.stringify({
          id: 'newer',
          modifiedTime: '2024-06-01T00:00:00.000Z',
          webViewLink: 'https://drive.google.com/view',
          webContentLink: 'https://drive.google.com/download',
        })
      );

    const metadata = await getSyncFileMetadata(ACCESS_TOKEN);

    expect(metadata?.id).toBe('newer');
    expect(requests()[2].url).toContain('/files/newer');
  });

  it('throws rather than returning null when Drive rejects the search', async () => {
    fetchMock.mockResponseOnce('{"error":{"code":401}}', { status: 401 });

    await expect(getSyncFileMetadata(ACCESS_TOKEN)).rejects.toThrow(
      /Google Drive API request failed \(401/
    );
  });
});

describe('writeSyncFile', () => {
  const blob = new Blob(['{}'], { type: 'application/json' });

  const createdFile = JSON.stringify({
    id: 'file-id',
    modifiedTime: '2024-06-01T00:00:00.000Z',
    webViewLink: 'https://drive.google.com/view',
    webContentLink: 'https://drive.google.com/download',
  });

  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it('patches in place when the file id is already known', async () => {
    fetchMock.mockResponseOnce(createdFile);

    await writeSyncFile(ACCESS_TOKEN, blob, 'file-id');

    expect(fetchMock).toBeCalledTimes(1);
    expect(requests()[0].method).toBe('PATCH');
    expect(requests()[0].url).toContain('/upload/drive/v3/files/file-id');
  });

  it('creates the folder as JSON through files.create, not the upload endpoint', async () => {
    fetchMock
      .mockResponseOnce(JSON.stringify({ files: [] }))
      .mockResponseOnce(JSON.stringify({ id: 'folder-id' }))
      .mockResponseOnce(createdFile);

    await writeSyncFile(ACCESS_TOKEN, blob);

    const folderCreate = requests()[1];
    expect(folderCreate.method).toBe('POST');
    expect(folderCreate.url).toBe(
      'https://www.googleapis.com/drive/v3/files?fields=id'
    );

    const init = fetchMock.mock.calls[1][1] as RequestInit;
    expect(JSON.parse(init.body as string)).toEqual({
      name: 'stylebot',
      mimeType: 'application/vnd.google-apps.folder',
    });
  });

  it('reuses an existing folder instead of creating a second one', async () => {
    fetchMock
      .mockResponseOnce(JSON.stringify({ files: [{ id: 'folder-id' }] }))
      .mockResponseOnce(createdFile);

    await writeSyncFile(ACCESS_TOKEN, blob);

    const folderCreates = requests().filter(
      r =>
        r.method === 'POST' &&
        r.url === 'https://www.googleapis.com/drive/v3/files?fields=id'
    );

    expect(folderCreates).toHaveLength(0);
  });

  it('creates exactly one folder across two consecutive creates', async () => {
    fetchMock
      // first create: no folder yet
      .mockResponseOnce(JSON.stringify({ files: [] }))
      .mockResponseOnce(JSON.stringify({ id: 'folder-id' }))
      .mockResponseOnce(createdFile)
      // second create: the folder now exists
      .mockResponseOnce(JSON.stringify({ files: [{ id: 'folder-id' }] }))
      .mockResponseOnce(createdFile);

    await writeSyncFile(ACCESS_TOKEN, blob);
    await writeSyncFile(ACCESS_TOKEN, blob);

    const folderCreates = requests().filter(
      r =>
        r.method === 'POST' &&
        r.url === 'https://www.googleapis.com/drive/v3/files?fields=id'
    );

    expect(folderCreates).toHaveLength(1);
  });
});

describe('downloadSyncFile', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  const codeOf = async (promise: Promise<unknown>) => {
    try {
      await promise;
      return 'resolved';
    } catch (e) {
      return isSyncError(e) ? e.code : 'not-a-sync-error';
    }
  };

  it('returns the style map', async () => {
    const styles = {
      'example.com': { css: 'a {}', enabled: true, readability: false },
    };
    fetchMock.mockResponseOnce(JSON.stringify(styles));

    await expect(downloadSyncFile(ACCESS_TOKEN, 'file-id')).resolves.toEqual(
      styles
    );
  });

  it('reports a parse error rather than handing a null body to the merge', async () => {
    fetchMock.mockResponseOnce('null');

    expect(await codeOf(downloadSyncFile(ACCESS_TOKEN, 'file-id'))).toBe(
      'parse'
    );
  });

  it('reports a parse error for a body that is not JSON', async () => {
    fetchMock.mockResponseOnce('not json');

    expect(await codeOf(downloadSyncFile(ACCESS_TOKEN, 'file-id'))).toBe(
      'parse'
    );
  });

  it('reports a parse error when an entry is not a style', async () => {
    fetchMock.mockResponseOnce(JSON.stringify({ 'example.com': 'a {}' }));

    expect(await codeOf(downloadSyncFile(ACCESS_TOKEN, 'file-id'))).toBe(
      'parse'
    );
  });
});
