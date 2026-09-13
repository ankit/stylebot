jest.mock('../styles');
jest.mock('@stylebot/utils');

import {
  SetReadability,
  ReadabilityActiveChanged,
  RequestEditorInjection,
} from '../messages';
import * as stylesModule from '../styles';
import * as utilsModule from '@stylebot/utils';

describe('SetReadability', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    global.chrome = {
      tabs: { sendMessage: jest.fn() },
    } as unknown as typeof chrome;
  });

  it('persists the value and refreshes the badge for the sending tab', async () => {
    const tab = { id: 1, url: 'https://example.com/article' } as chrome.tabs.Tab;

    await SetReadability(
      { name: 'SetReadability', url: 'example.com', value: true },
      { tab }
    );

    expect(stylesModule.setReadability).toBeCalledWith('example.com', true);
    expect(stylesModule.refreshBadgeForTab).toBeCalledWith(tab);
  });

  it('relays the change to the sending tab so other content scripts stay in sync', async () => {
    const tab = { id: 1, url: 'https://example.com/article' } as chrome.tabs.Tab;

    await SetReadability(
      { name: 'SetReadability', url: 'example.com', value: true },
      { tab }
    );

    expect(chrome.tabs.sendMessage).toBeCalledWith(1, {
      name: 'ReadabilityStateChanged',
      value: true,
    });
  });

  it('does not attempt to update the badge when there is no sending tab', async () => {
    await SetReadability(
      { name: 'SetReadability', url: 'example.com', value: true },
      {}
    );

    expect(stylesModule.setReadability).toBeCalledWith('example.com', true);
    expect(stylesModule.refreshBadgeForTab).not.toBeCalled();
  });
});

describe('ReadabilityActiveChanged', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('refreshes the badge for the sending tab', async () => {
    const tab = { id: 1, url: 'https://example.com/article' } as chrome.tabs.Tab;

    await ReadabilityActiveChanged({ name: 'ReadabilityActiveChanged' }, { tab });

    expect(stylesModule.refreshBadgeForTab).toBeCalledWith(tab);
  });

  it('does nothing when there is no sending tab', async () => {
    await ReadabilityActiveChanged({ name: 'ReadabilityActiveChanged' }, {});

    expect(stylesModule.refreshBadgeForTab).not.toBeCalled();
  });
});

describe('RequestEditorInjection', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    global.chrome = {
      tabs: { sendMessage: jest.fn() },
    } as unknown as typeof chrome;
    (utilsModule.ensureEditorInjected as jest.Mock).mockResolvedValue(
      undefined
    );
  });

  it('injects the editor then relays the matched command to the sending tab', async () => {
    const tab = { id: 7, url: 'https://example.com' } as chrome.tabs.Tab;

    await RequestEditorInjection(
      { name: 'RequestEditorInjection', command: 'stylebot' },
      { tab }
    );

    expect(utilsModule.ensureEditorInjected).toBeCalledWith(7);
    expect(chrome.tabs.sendMessage).toBeCalledWith(7, {
      name: 'RunCommand',
      command: 'stylebot',
    });
  });

  it('does nothing when there is no sending tab', async () => {
    await RequestEditorInjection(
      { name: 'RequestEditorInjection', command: 'stylebot' },
      {}
    );

    expect(utilsModule.ensureEditorInjected).not.toBeCalled();
  });
});
