jest.mock('../styles');
jest.mock('../ai');

import { SetReadability, ReadabilityActiveChanged, GenerateCss } from '../messages';
import * as stylesModule from '../styles';
import * as aiModule from '../ai';

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

describe('GenerateCss', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('responds with the generated css on success', async () => {
    (aiModule.generateCss as jest.Mock).mockResolvedValue('a { color: red; }');
    const sendResponse = jest.fn();

    await GenerateCss(
      {
        name: 'GenerateCss',
        prompt: 'make links red',
        css: '',
        url: 'example.com',
      },
      sendResponse
    );

    expect(aiModule.generateCss).toBeCalledWith({
      prompt: 'make links red',
      css: '',
      url: 'example.com',
    });
    expect(sendResponse).toBeCalledWith({ css: 'a { color: red; }' });
  });

  it('responds with an error code when generation fails', async () => {
    const error = new Error('boom');
    (aiModule.generateCss as jest.Mock).mockRejectedValue(error);
    (aiModule.getErrorCode as jest.Mock).mockReturnValue('unknown_error');
    const sendResponse = jest.fn();

    await GenerateCss(
      { name: 'GenerateCss', prompt: 'x', css: '', url: 'example.com' },
      sendResponse
    );

    expect(aiModule.getErrorCode).toBeCalledWith(error);
    expect(sendResponse).toBeCalledWith({ error: 'unknown_error' });
  });
});
