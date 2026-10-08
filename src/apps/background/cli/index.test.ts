import { OpenOptionsPage } from '../messages';
import { get as getOption } from '../options';
import { initCliBridge, updateCliBridge } from './index';
import { pageCommands } from './pages';
import { restoreOpenTabs } from './restore-tabs';

jest.mock('../messages', () => ({ OpenOptionsPage: jest.fn() }));
jest.mock('../options', () => ({ get: jest.fn() }));
jest.mock('./inspect', () => ({ inspectCommands: {} }));
jest.mock('./pages', () => ({
  pageCommands: { tabs: jest.fn(async () => ['tab']) },
}));
jest.mock('./pointer', () => ({ pointerCommands: {} }));
jest.mock('./profiles', () => ({ profileCommands: {} }));
jest.mock('./restore-tabs', () => ({ restoreOpenTabs: jest.fn() }));
jest.mock('./styles', () => ({ styleCommands: {} }));

type Listener = (...args: Array<unknown>) => void;

const listeners: Record<string, Listener> = {};
const listen = (name: string) => ({
  addListener: (listener: Listener) => (listeners[name] = listener),
});

let granted: boolean;
let storage: Record<string, unknown>;
let port: {
  disconnect: jest.Mock;
  onDisconnect: { addListener: (l: Listener) => void };
  onMessage: { addListener: (l: Listener) => void };
  postMessage: jest.Mock;
};

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

const setOption = (cliAccess: boolean) =>
  (getOption as jest.Mock).mockResolvedValue(cliAccess);

const changeOption = (was: boolean, is: boolean) => {
  setOption(is);
  listeners.storageChanged(
    {
      options: { oldValue: { cliAccess: was }, newValue: { cliAccess: is } },
    },
    'local'
  );
  return updateCliBridge();
};

const connectNative = jest.fn(() => {
  port = {
    disconnect: jest.fn(),
    onDisconnect: listen('portDisconnected'),
    onMessage: listen('portMessage'),
    postMessage: jest.fn(),
  };
  return port;
});

beforeEach(async () => {
  granted = true;
  storage = {};
  setOption(false);

  global.chrome = {
    runtime: {
      lastError: undefined,
      connectNative,
      reload: jest.fn(),
      getManifest: () => ({ version: '4.0.0' }),
    },
    permissions: {
      contains: jest.fn((_permissions, callback) => callback(granted)),
      onAdded: listen('permissionsAdded'),
      onRemoved: listen('permissionsRemoved'),
    },
    storage: {
      local: {
        get: jest.fn((key: string) =>
          Promise.resolve(key in storage ? { [key]: storage[key] } : {})
        ),
        set: jest.fn((items: Record<string, unknown>) => {
          Object.assign(storage, items);
          return Promise.resolve();
        }),
        remove: jest.fn((key: string) => {
          delete storage[key];
          return Promise.resolve();
        }),
      },
      onChanged: listen('storageChanged'),
    },
  } as unknown as typeof chrome;

  initCliBridge();
  await updateCliBridge();

  // Each test starts disconnected, whatever the last one left behind.
  setOption(false);
  await updateCliBridge();
  jest.clearAllMocks();
});

/**
 * Starts the worker again, as Chrome does after chrome.runtime.reload().
 */
const restart = async (runtime: Partial<typeof chrome.runtime>) => {
  Object.assign(chrome.runtime, runtime);
  initCliBridge();
  await updateCliBridge();
};

describe('initCliBridge', () => {
  it('stays disconnected while the setting is off', async () => {
    granted = true;
    listeners.permissionsAdded({});
    await updateCliBridge();

    expect(chrome.runtime.connectNative).not.toBeCalled();
  });

  it('stays disconnected while the permissions are missing', async () => {
    granted = false;
    await changeOption(false, true);

    expect(chrome.runtime.connectNative).not.toBeCalled();
  });

  it('connects once when the setting turns on with permissions granted', async () => {
    await changeOption(false, true);
    await updateCliBridge();

    expect(chrome.runtime.connectNative).toBeCalledTimes(1);
    expect(chrome.runtime.connectNative).toBeCalledWith('dev.stylebot.cli');
  });

  it('connects when the permissions are granted after the setting', async () => {
    granted = false;
    await changeOption(false, true);

    granted = true;
    listeners.permissionsAdded({});
    await updateCliBridge();

    expect(chrome.runtime.connectNative).toBeCalledTimes(1);
  });

  it('disconnects when the setting turns off', async () => {
    await changeOption(false, true);
    await changeOption(true, false);

    expect(port.disconnect).toBeCalled();
  });

  it('disconnects when a permission is removed', async () => {
    await changeOption(false, true);

    granted = false;
    listeners.permissionsRemoved({});
    await updateCliBridge();

    expect(port.disconnect).toBeCalled();
  });

  it('ignores changes to other options', async () => {
    setOption(true);
    listeners.storageChanged(
      {
        options: {
          oldValue: { cliAccess: false, mode: 'basic' },
          newValue: { cliAccess: false, mode: 'code' },
        },
      },
      'local'
    );
    await flush();

    expect(chrome.runtime.connectNative).not.toBeCalled();
  });

  it("doesn't reconnect on its own after the host goes away", async () => {
    await changeOption(false, true);
    listeners.portDisconnected();
    await flush();

    expect(chrome.runtime.connectNative).toBeCalledTimes(1);
  });

  it('reloads to get connectNative when the grant reaches a running worker', async () => {
    chrome.runtime.connectNative = undefined as never;
    setOption(true);
    listeners.storageChanged(
      {
        options: {
          oldValue: { cliAccess: false },
          newValue: { cliAccess: true },
        },
      },
      'local'
    );
    await flush();

    expect(chrome.runtime.reload).toBeCalledTimes(1);
    expect(storage).toEqual({ 'cli-reloaded-for-grant': true });
  });

  it('connects, restores open tabs and reopens Options on Basics after that reload', async () => {
    storage['cli-reloaded-for-grant'] = true;
    setOption(true);

    await restart({ connectNative } as never);

    expect(connectNative).toBeCalledTimes(1);
    expect(restoreOpenTabs).toBeCalledTimes(1);
    expect(OpenOptionsPage).toBeCalledWith({ route: '/basics' });
    expect(storage).toEqual({});
  });

  it('leaves open tabs alone on an ordinary start', async () => {
    setOption(true);

    await restart({ connectNative } as never);

    expect(restoreOpenTabs).not.toBeCalled();
  });

  it("doesn't reload again when connectNative is still missing after it", async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    storage['cli-reloaded-for-grant'] = true;
    setOption(true);

    await restart({ connectNative: undefined } as never);

    expect(chrome.runtime.reload).not.toBeCalled();
    expect(console.error).toBeCalled();
  });
});

describe('CLI requests', () => {
  /**
   * Sends a request through the connected port and resolves to the response.
   */
  const send = async (request: Record<string, unknown>) => {
    await changeOption(false, true);
    await listeners.portMessage({
      id: 7,
      command: 'tabs',
      args: {},
      ...request,
    });
    return port.postMessage.mock.calls[0][0];
  };

  it('runs a request in its protocol and stamps the response with its own', async () => {
    expect(await send({ protocol: 1, version: '0.1.0' })).toEqual({
      id: 7,
      protocol: 1,
      version: '4.0.0',
      result: ['tab'],
    });
  });

  it('refuses a request in another protocol without running it', async () => {
    const response = await send({ protocol: 2, version: '0.9.0' });

    expect(response).toMatchObject({ id: 7, protocol: 1, version: '4.0.0' });
    expect(response.error).toMatch(/protocol 2/);
    expect(pageCommands.tabs).not.toBeCalled();
  });

  it('runs a request from before the handshake', async () => {
    expect(await send({})).toMatchObject({ protocol: 1, result: ['tab'] });
  });
});
