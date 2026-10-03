import { configureSidePanelTabs, initSidePanelTabs } from './side-panel-tabs';

const makeChrome = (dockLocation: string, { sidePanel = true } = {}) => {
  const listeners: {
    created?: (tab: chrome.tabs.Tab) => void;
    changed?: (
      changes: Record<string, chrome.storage.StorageChange>,
      area: string
    ) => void;
  } = {};

  const api = {
    storage: {
      local: {
        get: jest.fn(async () => ({
          options: {
            layout: { width: 360, adjustPageLayout: false, dockLocation },
          },
        })),
      },
      onChanged: {
        addListener: (fn: typeof listeners.changed) => {
          listeners.changed = fn;
        },
      },
    },
    tabs: {
      query: jest.fn(async () => [{ id: 1 }, { id: 2 }]),
      onCreated: {
        addListener: (fn: typeof listeners.created) => {
          listeners.created = fn;
        },
      },
    },
    sidePanel: sidePanel
      ? { open: jest.fn(), setOptions: jest.fn(async () => undefined) }
      : undefined,
  };

  global.chrome = api as unknown as typeof chrome;
  return { api, listeners };
};

const flush = () => new Promise(resolve => setTimeout(resolve));

describe('configureSidePanelTabs', () => {
  it('sets up the editor’s panel on every tab while the side panel is the dock', async () => {
    const { api } = makeChrome('sidepanel');

    await configureSidePanelTabs();

    expect(api.sidePanel?.setOptions).toBeCalledWith({
      tabId: 1,
      path: 'editor-window/index.html?tabId=1&host=sidepanel',
      enabled: true,
    });
    expect(api.sidePanel?.setOptions).toBeCalledWith({
      tabId: 2,
      path: 'editor-window/index.html?tabId=2&host=sidepanel',
      enabled: true,
    });
  });

  it('takes the panel away while the editor docks elsewhere', async () => {
    const { api } = makeChrome('right');

    await configureSidePanelTabs();

    expect(api.sidePanel?.setOptions).toBeCalledWith({
      tabId: 1,
      enabled: false,
    });
    expect(api.sidePanel?.setOptions).toBeCalledWith({
      tabId: 2,
      enabled: false,
    });
  });

  it('does nothing in a browser without a side panel', async () => {
    const { api } = makeChrome('right', { sidePanel: false });

    await configureSidePanelTabs();

    expect(api.tabs.query).not.toBeCalled();
  });
});

describe('initSidePanelTabs', () => {
  it('sets up a new tab and every tab when the dock changes, but not for other option changes', async () => {
    const { api, listeners } = makeChrome('sidepanel');
    initSidePanelTabs();

    listeners.created?.({ id: 9 } as chrome.tabs.Tab);
    await flush();
    expect(api.sidePanel?.setOptions).toBeCalledTimes(1);
    expect(api.sidePanel?.setOptions).toBeCalledWith(
      expect.objectContaining({ tabId: 9, enabled: true })
    );

    listeners.changed?.(
      {
        options: {
          oldValue: { mode: 'basic', layout: { dockLocation: 'sidepanel' } },
          newValue: { mode: 'code', layout: { dockLocation: 'sidepanel' } },
        },
      },
      'local'
    );
    await flush();
    expect(api.tabs.query).not.toBeCalled();

    listeners.changed?.(
      {
        options: {
          oldValue: { layout: { dockLocation: 'right' } },
          newValue: { layout: { dockLocation: 'sidepanel' } },
        },
      },
      'local'
    );
    await flush();
    expect(api.tabs.query).toBeCalled();
  });
});
