jest.mock('../styles');

import { SetReadability, ReadabilityActiveChanged } from '../messages';
import * as stylesModule from '../styles';

describe('SetReadability', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    (stylesModule.getAll as jest.Mock).mockResolvedValue({});
    (stylesModule.getStylesForPage as jest.Mock).mockReturnValue({
      styles: [],
      defaultStyle: { url: 'example.com', css: '', enabled: true, readability: true },
    });
    (stylesModule.getIsReadabilityActive as jest.Mock).mockResolvedValue(true);
  });

  it('persists the value and refreshes the badge with the live readability state', async () => {
    const tab = { id: 1, url: 'https://example.com/article' } as chrome.tabs.Tab;

    await SetReadability(
      { name: 'SetReadability', url: 'example.com', value: true },
      { tab }
    );

    expect(stylesModule.setReadability).toBeCalledWith('example.com', true);
    expect(stylesModule.getStylesForPage).toBeCalledWith(
      tab.url,
      expect.anything()
    );
    expect(stylesModule.getIsReadabilityActive).toBeCalledWith(1);
    expect(stylesModule.updateIcon).toBeCalledWith(tab, [], true);
  });

  it('does not attempt to update the badge when there is no sending tab', async () => {
    await SetReadability(
      { name: 'SetReadability', url: 'example.com', value: true },
      {}
    );

    expect(stylesModule.setReadability).toBeCalledWith('example.com', true);
    expect(stylesModule.updateIcon).not.toBeCalled();
  });
});

describe('ReadabilityActiveChanged', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    (stylesModule.getAll as jest.Mock).mockResolvedValue({});
    (stylesModule.getStylesForPage as jest.Mock).mockReturnValue({
      styles: [],
      defaultStyle: { url: 'example.com', css: '', enabled: true, readability: true },
    });
  });

  it('re-queries the live state and refreshes the badge for the sending tab', async () => {
    const tab = { id: 1, url: 'https://example.com/article' } as chrome.tabs.Tab;
    (stylesModule.getIsReadabilityActive as jest.Mock).mockResolvedValue(true);

    await ReadabilityActiveChanged({ name: 'ReadabilityActiveChanged' }, { tab });

    expect(stylesModule.getIsReadabilityActive).toBeCalledWith(1);
    expect(stylesModule.updateIcon).toBeCalledWith(tab, [], true);
  });

  it('reflects a false live answer even if a style is stored as readability:true', async () => {
    const tab = { id: 1, url: 'https://example.com/main-page' } as chrome.tabs.Tab;
    (stylesModule.getIsReadabilityActive as jest.Mock).mockResolvedValue(false);

    await ReadabilityActiveChanged({ name: 'ReadabilityActiveChanged' }, { tab });

    expect(stylesModule.updateIcon).toBeCalledWith(tab, [], false);
  });

  it('does nothing when there is no sending tab', async () => {
    await ReadabilityActiveChanged({ name: 'ReadabilityActiveChanged' }, {});

    expect(stylesModule.getIsReadabilityActive).not.toBeCalled();
    expect(stylesModule.updateIcon).not.toBeCalled();
  });
});
