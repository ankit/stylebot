import {
  isEditorSidePanelOpen,
  markSidePanelIgnoringTabs,
} from '@stylebot/utils';

import { get as getOption, set as setOption } from './options';
import {
  canUseEditorSidePanel,
  checkEditorSidePanel,
} from './side-panel-check';

jest.mock('@stylebot/utils', () => ({
  ...jest.requireActual('@stylebot/utils'),
  isEditorSidePanelOpen: jest.fn(),
  markSidePanelIgnoringTabs: jest.fn(() => Promise.resolve()),
  supportsEditorSidePanel: () => true,
}));
jest.mock('./options', () => ({
  get: jest.fn(),
  set: jest.fn(() => Promise.resolve()),
}));

const layout = {
  width: 360,
  adjustPageLayout: false,
  dockLocation: 'sidepanel',
};

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  (getOption as jest.Mock).mockResolvedValue(layout);
  global.chrome = {
    tabs: {
      get: jest.fn(() => Promise.resolve({ id: 7, windowId: 3 })),
      sendMessage: jest.fn(),
    },
    sidePanel: { close: jest.fn(() => Promise.resolve()) },
    runtime: {},
  } as unknown as typeof chrome;
});

afterEach(() => jest.useRealTimers());

describe('checkEditorSidePanel', () => {
  it('leaves the side panel alone once it shows the editor', async () => {
    (isEditorSidePanelOpen as jest.Mock)
      .mockResolvedValueOnce(false)
      .mockResolvedValue(true);

    const check = checkEditorSidePanel(7);
    await jest.advanceTimersByTimeAsync(1000);
    await check;

    expect(markSidePanelIgnoringTabs).not.toBeCalled();
    expect(setOption).not.toBeCalled();
    expect(canUseEditorSidePanel()).toBe(true);
  });

  it('docks the editor in the page when the panel never shows it', async () => {
    (isEditorSidePanelOpen as jest.Mock).mockResolvedValue(false);

    const check = checkEditorSidePanel(7);
    await jest.advanceTimersByTimeAsync(6000);
    await check;

    expect(markSidePanelIgnoringTabs).toBeCalled();
    expect(setOption).toBeCalledWith('layout', {
      ...layout,
      dockLocation: 'right',
    });
    expect(chrome.sidePanel.close).toBeCalledWith({ windowId: 3 });
    expect(chrome.tabs.sendMessage).toBeCalledWith(
      7,
      { name: 'OpenStylebot' },
      expect.any(Function)
    );
    expect(canUseEditorSidePanel()).toBe(false);
  });
});
