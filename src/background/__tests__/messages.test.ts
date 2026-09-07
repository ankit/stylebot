jest.mock('../styles');

import { SetReadability, ReadabilityActiveChanged } from '../messages';
import * as stylesModule from '../styles';

describe('SetReadability', () => {
  beforeEach(() => {
    jest.resetAllMocks();
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
