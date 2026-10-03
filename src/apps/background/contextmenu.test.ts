import { openEditorSidePanel } from '@stylebot/utils';

import { handleContextMenuClick } from './contextmenu';

jest.mock('@stylebot/utils', () => ({
  ...jest.requireActual('@stylebot/utils'),
  openEditorSidePanel: jest.fn(() => Promise.resolve()),
}));
jest.mock('./messages', () => ({ OpenOptionsPage: jest.fn() }));

const tab = { id: 7 } as chrome.tabs.Tab;

beforeEach(() => {
  jest.clearAllMocks();
  global.chrome = {
    tabs: { sendMessage: jest.fn() },
  } as unknown as typeof chrome;
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
