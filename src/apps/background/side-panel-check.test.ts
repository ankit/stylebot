import {
  isEditorSidePanelOpen,
  isSidePanelIgnoringTabs,
} from '@stylebot/utils';

import { get as getOption, set as setOption } from './options';
import { onEditorSidePanelOpened } from './side-panel-check';

jest.mock('@stylebot/utils', () => ({
  ...jest.requireActual('@stylebot/utils'),
  isEditorSidePanelOpen: jest.fn(),
  isSidePanelIgnoringTabs: jest.fn(),
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

const openStylebot = () =>
  expect(chrome.tabs.sendMessage).toBeCalledWith(
    7,
    { name: 'OpenStylebot' },
    expect.any(Function)
  );

const check = async () => {
  const done = onEditorSidePanelOpened(7);
  await jest.advanceTimersByTimeAsync(3000);
  await done;
};

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  (getOption as jest.Mock).mockResolvedValue(layout);
  (isEditorSidePanelOpen as jest.Mock).mockResolvedValue(false);
  (isSidePanelIgnoringTabs as jest.Mock).mockResolvedValue(false);
  global.chrome = {
    tabs: { sendMessage: jest.fn() },
    runtime: {},
  } as unknown as typeof chrome;
});

afterEach(() => jest.useRealTimers());

describe('onEditorSidePanelOpened', () => {
  it('leaves the side panel alone once it shows the editor', async () => {
    (isEditorSidePanelOpen as jest.Mock)
      .mockResolvedValueOnce(false)
      .mockResolvedValue(true);

    await check();

    expect(setOption).not.toBeCalled();
    expect(chrome.tabs.sendMessage).not.toBeCalled();
  });

  it('leaves the side panel alone when it reports nothing in time', async () => {
    await check();

    expect(setOption).not.toBeCalled();
    expect(chrome.tabs.sendMessage).not.toBeCalled();
  });

  it('docks the editor in the page once the panel reports it is hosted as a tab', async () => {
    (isSidePanelIgnoringTabs as jest.Mock)
      .mockResolvedValueOnce(false)
      .mockResolvedValue(true);

    await check();

    expect(setOption).toBeCalledWith('layout', {
      ...layout,
      dockLocation: 'right',
    });
    openStylebot();
  });

  it('opens the editor in the page at once when the browser is already known', async () => {
    (isSidePanelIgnoringTabs as jest.Mock).mockResolvedValue(true);
    (getOption as jest.Mock).mockResolvedValue({
      ...layout,
      dockLocation: 'right',
    });

    await onEditorSidePanelOpened(7);

    expect(isEditorSidePanelOpen).not.toBeCalled();
    expect(setOption).not.toBeCalled();
    openStylebot();
  });
});
