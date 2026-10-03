import { openEditorSidePanel } from '@stylebot/utils';

import { defaultOptions } from '@stylebot/settings';
import type { StylebotOptions } from '@stylebot/types';

import { ContextMenu, handleContextMenuClick } from './contextmenu';
import { getAll as getAllOptions } from './options';

jest.mock('@stylebot/utils', () => ({
  ...jest.requireActual('@stylebot/utils'),
  openEditorSidePanel: jest.fn(() => Promise.resolve()),
}));
jest.mock('./messages', () => ({ OpenOptionsPage: jest.fn() }));
jest.mock('./options', () => ({ getAll: jest.fn() }));

const mockOptions = (overrides: Partial<StylebotOptions>) =>
  (getAllOptions as jest.Mock).mockResolvedValue({
    ...defaultOptions,
    ...overrides,
  });

const tab = { id: 7 } as chrome.tabs.Tab;

beforeEach(() => {
  jest.clearAllMocks();
  global.chrome = {
    tabs: { sendMessage: jest.fn() },
    contextMenus: {
      create: jest.fn(),
      update: jest.fn(),
      removeAll: jest.fn(),
    },
    storage: { onChanged: { addListener: jest.fn() } },
    i18n: { getMessage: jest.fn((key: string) => key) },
  } as unknown as typeof chrome;
  ContextMenu.shown = undefined;
});

describe('ContextMenu.sync', () => {
  it('creates the menu when the option is on', async () => {
    mockOptions({ contextMenu: true });

    await ContextMenu.sync();

    expect(chrome.contextMenus.create).toBeCalledWith(
      expect.objectContaining({ id: 'stylebot-contextmenu' })
    );
  });

  it('removes the menu without creating it when the option is off', async () => {
    mockOptions({ contextMenu: false });

    await ContextMenu.sync();

    expect(chrome.contextMenus.removeAll).toBeCalled();
    expect(chrome.contextMenus.create).not.toBeCalled();
  });

  it('removes the menu when the option is turned off', async () => {
    mockOptions({ contextMenu: true });
    await ContextMenu.sync();
    jest.clearAllMocks();

    mockOptions({ contextMenu: false });
    await ContextMenu.sync();

    expect(chrome.contextMenus.removeAll).toBeCalled();
    expect(chrome.contextMenus.create).not.toBeCalled();
  });

  it('leaves the menu alone when another option changes', async () => {
    mockOptions({ contextMenu: true });
    await ContextMenu.sync();
    jest.clearAllMocks();

    mockOptions({ contextMenu: true, appearance: 'dark' });
    await ContextMenu.sync();

    expect(chrome.contextMenus.removeAll).not.toBeCalled();
    expect(chrome.contextMenus.create).not.toBeCalled();
  });
});

describe('handleContextMenuClick', () => {
  it('opens the side panel straight from the click on its item', () => {
    handleContextMenuClick(
      {
        menuItemId: 'style-element-side-panel',
      } as chrome.contextMenus.OnClickData,
      tab
    );

    expect(openEditorSidePanel).toBeCalledWith(7);
    expect(chrome.tabs.sendMessage).toBeCalledWith(7, {
      name: 'OpenStylebotFromContextMenu',
      sidePanel: true,
    });
  });

  it('leaves opening the editor to the page on the other item', () => {
    handleContextMenuClick(
      { menuItemId: 'style-element' } as chrome.contextMenus.OnClickData,
      tab
    );

    expect(openEditorSidePanel).not.toBeCalled();
    expect(chrome.tabs.sendMessage).toBeCalledWith(7, {
      name: 'OpenStylebotFromContextMenu',
      sidePanel: false,
    });
  });
});
