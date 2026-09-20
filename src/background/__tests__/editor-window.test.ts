const makeChrome = () => {
  const session: Record<string, unknown> = {};
  const windows = new Map<number, chrome.windows.Window>();
  let nextWindowId = 100;

  const api = {
    runtime: { getURL: (path: string) => `chrome-extension://id/${path}` },
    storage: {
      session: {
        get: jest.fn(async (key: string) => ({ [key]: session[key] })),
        set: jest.fn(async (items: Record<string, unknown>) => {
          Object.assign(session, items);
        }),
      },
      local: {
        get: jest.fn(
          async (): Promise<Record<string, unknown>> => ({
            options: { layout: { width: 350 } },
          })
        ),
      },
    },
    tabs: {
      get: jest.fn(
        async (tabId: number): Promise<Partial<chrome.tabs.Tab>> => ({
          id: tabId,
          windowId: 1,
          url: 'https://example.com/',
        })
      ),
    },
    windows: {
      create: jest.fn(async (info: chrome.windows.CreateData) => {
        const win = { id: nextWindowId++, ...info } as chrome.windows.Window;
        windows.set(win.id as number, win);
        return win;
      }),
      get: jest.fn(async (id: number) => {
        const win =
          id === 1
            ? { id: 1, left: 0, top: 0, width: 1400, height: 900 }
            : windows.get(id);
        if (!win) {
          throw new Error('No window with id');
        }
        return win;
      }),
      update: jest.fn(async () => undefined),
      remove: jest.fn(async (id: number) => {
        windows.delete(id);
      }),
    },
  };

  return { api, session, windows };
};

describe('editor-window', () => {
  let fake: ReturnType<typeof makeChrome>;
  let editorWindow: typeof import('../editor-window');

  beforeEach(async () => {
    jest.resetModules();
    fake = makeChrome();
    global.chrome = fake.api as unknown as typeof chrome;
    editorWindow = await import('../editor-window');
  });

  it('opens a popup window for the tab and remembers it', async () => {
    await editorWindow.open(7);

    expect(fake.api.windows.create).toBeCalledWith(
      expect.objectContaining({
        url: 'chrome-extension://id/editor-window/index.html?tabId=7',
        type: 'popup',
        focused: true,
        width: 420,
      })
    );
    expect(fake.session.editorWindows).toEqual({ 7: 100 });
    await expect(editorWindow.isOpen(7)).resolves.toBe(true);
  });

  it('focuses the existing window instead of opening a second one', async () => {
    await editorWindow.open(7);
    await editorWindow.open(7);

    expect(fake.api.windows.create).toBeCalledTimes(1);
    expect(fake.api.windows.update).toBeCalledWith(100, { focused: true });
  });

  it('refuses pages Stylebot cannot style', async () => {
    fake.api.tabs.get.mockResolvedValueOnce({
      id: 7,
      windowId: 1,
      url: 'chrome://extensions',
    });

    await editorWindow.open(7);

    expect(fake.api.windows.create).not.toBeCalled();
  });

  it('restores saved bounds when the layout has them', async () => {
    fake.api.storage.local.get.mockResolvedValueOnce({
      options: {
        layout: { window: { width: 500, height: 700, left: 40, top: 60 } },
      },
    });

    await editorWindow.open(7);

    expect(fake.api.windows.create).toBeCalledWith(
      expect.objectContaining({ width: 500, height: 700, left: 40, top: 60 })
    );
  });

  it('falls back to a placed window, then to defaults, when bounds are refused', async () => {
    fake.api.windows.create
      .mockRejectedValueOnce(new Error('Invalid value for bounds'))
      .mockRejectedValueOnce(new Error('Invalid value for bounds'));

    await editorWindow.open(7);

    const calls = fake.api.windows.create.mock.calls.map(([info]) => info);
    expect(calls).toHaveLength(3);
    expect(calls[0]).toEqual(
      expect.objectContaining({ width: 420, left: expect.any(Number) })
    );
    expect(calls[1]).toEqual(expect.objectContaining({ width: 420 }));
    expect(calls[1]).not.toHaveProperty('left');
    expect(calls[2]).not.toHaveProperty('width');
    await expect(editorWindow.isOpen(7)).resolves.toBe(true);
  });

  it('toggle closes an open window and opens a missing one', async () => {
    await editorWindow.toggle(7);
    expect(fake.api.windows.create).toBeCalledTimes(1);

    await editorWindow.toggle(7);
    expect(fake.api.windows.remove).toBeCalledWith(100);
    await expect(editorWindow.isOpen(7)).resolves.toBe(false);
  });

  it('forgets a window the user closed', async () => {
    await editorWindow.open(7);
    fake.windows.delete(100);
    await editorWindow.forgetWindow(100);

    await expect(editorWindow.isOpen(7)).resolves.toBe(false);
    expect(fake.session.editorWindows).toEqual({});
  });

  it('closes the window when its tab closes', async () => {
    await editorWindow.open(7);
    await editorWindow.close(7);

    expect(fake.api.windows.remove).toBeCalledWith(100);
  });

  it('drops a registry entry whose window no longer exists', async () => {
    fake.session.editorWindows = { 7: 999 };

    await expect(editorWindow.isOpen(7)).resolves.toBe(false);
    expect(fake.session.editorWindows).toEqual({});
  });

  it('hydrates the registry from session storage after a restart', async () => {
    fake.session.editorWindows = { 7: 100 };
    fake.windows.set(100, { id: 100 } as chrome.windows.Window);

    await expect(editorWindow.isOpen(7)).resolves.toBe(true);
  });
});
