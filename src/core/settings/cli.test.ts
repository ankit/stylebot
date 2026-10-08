import {
  CLI_PERMISSIONS,
  hasCliPermissions,
  removeCliPermissions,
  requestCliPermissions,
} from './cli';

type Answer = (callback: (result: boolean) => void) => void;

const permissionsCall = (answer: Answer) =>
  jest.fn((_permissions, callback) => answer(callback));

beforeEach(() => {
  global.chrome = {
    runtime: { lastError: undefined },
    permissions: {
      contains: permissionsCall(callback => callback(true)),
      request: permissionsCall(callback => callback(true)),
      remove: permissionsCall(callback => callback(true)),
    },
  } as unknown as typeof chrome;
});

describe('CLI permissions', () => {
  it('checks for the native host and every site', async () => {
    await expect(hasCliPermissions()).resolves.toBe(true);

    expect(chrome.permissions.contains).toBeCalledWith(
      CLI_PERMISSIONS,
      expect.any(Function)
    );
  });

  it('asks for scripting too, to restore open tabs after the restart', async () => {
    await expect(requestCliPermissions()).resolves.toBe(true);

    expect(chrome.permissions.request).toBeCalledWith(
      {
        permissions: ['nativeMessaging', 'scripting'],
        origins: ['<all_urls>'],
      },
      expect.any(Function)
    );
  });

  it('removes only the native host, which Chrome lets go of', async () => {
    await removeCliPermissions();

    expect(chrome.permissions.remove).toBeCalledWith(
      { permissions: ['nativeMessaging'] },
      expect.any(Function)
    );
  });

  it('counts a call the browser rejects as not granted', async () => {
    chrome.permissions.contains = permissionsCall(() => {
      throw new Error(
        'Only permissions specified in the manifest may be requested.'
      );
    });

    await expect(hasCliPermissions()).resolves.toBe(false);
  });
});
