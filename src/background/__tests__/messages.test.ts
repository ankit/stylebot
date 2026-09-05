jest.mock('../styles');

import { SetReadability } from '../messages';
import * as stylesModule from '../styles';

describe('SetReadability', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    (stylesModule.getAll as jest.Mock).mockResolvedValue({});
    (stylesModule.getStylesForPage as jest.Mock).mockReturnValue({
      styles: [],
      defaultStyle: { url: 'example.com', css: '', enabled: true, readability: true },
    });
  });

  it('persists the value and refreshes the badge for the sending tab', async () => {
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
    expect(stylesModule.updateIcon).toBeCalledWith(
      tab,
      [],
      expect.objectContaining({ readability: true })
    );
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
