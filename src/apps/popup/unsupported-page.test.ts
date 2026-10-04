import { describeUnsupportedPage } from './unsupported-page';

describe('describeUnsupportedPage', () => {
  it.each([
    ['chrome://newtab/', 'new_tab'],
    ['chrome://new-tab-page/', 'new_tab'],
    ['chrome://settings/appearance', 'chrome_settings'],
    ['chrome://history', 'history'],
    ['chrome://extensions/?id=abc', 'extensions'],
    ['chrome://flags', 'browser_page'],
  ])('names %s as a browser page', (url, nameKey) => {
    expect(describeUnsupportedPage(url)).toEqual({
      nameKey,
      reasonKey: 'stylebot_cant_style_browser_pages',
      needsFileAccess: false,
    });
  });

  it('names extension pages', () => {
    expect(
      describeUnsupportedPage('chrome-extension://abc/options.html')
    ).toEqual({
      nameKey: 'extension_page',
      reasonKey: 'stylebot_cant_style_extension_pages',
      needsFileAccess: false,
    });
  });

  it.each([
    'https://chromewebstore.google.com/detail/stylebot/abc',
    'https://chrome.google.com/webstore/detail/stylebot/abc',
  ])('names %s as the Chrome Web Store', url => {
    expect(describeUnsupportedPage(url).nameKey).toBe('chrome_web_store');
  });

  it('points local files to the file access setting', () => {
    expect(describeUnsupportedPage('file:///Users/me/page.html')).toEqual({
      nameKey: 'local_file',
      reasonKey: 'allow_file_url_access_to_style_local_files',
      needsFileAccess: true,
    });
  });

  it('names a website file by its host', () => {
    expect(
      describeUnsupportedPage('https://example.com/report.pdf').nameKey
    ).toBeNull();
  });

  it.each(['view-source:https://example.com', 'data:text/html,hi'])(
    'falls back to a browser page for %s',
    url => {
      expect(describeUnsupportedPage(url)).toEqual({
        nameKey: 'browser_page',
        reasonKey: 'stylebot_cant_style_this_page',
        needsFileAccess: false,
      });
    }
  );
});
