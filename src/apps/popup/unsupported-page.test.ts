import { describeUnsupportedPage } from './unsupported-page';

describe('describeUnsupportedPage', () => {
  it.each([
    ['chrome://newtab/', 'new_tab', 'Chrome'],
    ['chrome://settings/appearance', 'browser_settings', 'Chrome'],
    ['chrome://history', 'history', 'Chrome'],
    ['chrome://extensions/?id=abc', 'extensions', 'Chrome'],
    ['chrome://flags', 'browser_page', 'Chrome'],
    ['edge://newtab/', 'new_tab', 'Edge'],
    ['edge://settings/profiles', 'browser_settings', 'Edge'],
    ['about:preferences#home', 'browser_settings', 'Firefox'],
    ['about:home', 'new_tab', 'Firefox'],
    ['about:config', 'browser_page', 'Firefox'],
  ])('names %s as a browser page', (url, key, browser) => {
    expect(describeUnsupportedPage(url, 'unreachable')).toEqual({
      name: { key, browser },
      reason: { key: 'stylebot_cant_style_browser_pages' },
      needsFileAccess: false,
    });
  });

  it.each([
    'chrome-extension://abc/options.html',
    'moz-extension://abc/options.html',
  ])('names %s as an extension page', url => {
    expect(describeUnsupportedPage(url, 'unreachable').name).toEqual({
      key: 'extension_page',
    });
  });

  it.each([
    [
      'https://chromewebstore.google.com/detail/abc',
      'chrome_web_store',
      'Chrome',
    ],
    [
      'https://chrome.google.com/webstore/detail/abc',
      'chrome_web_store',
      'Chrome',
    ],
    [
      'https://microsoftedge.microsoft.com/addons/detail/abc',
      'edge_add_ons',
      'Edge',
    ],
    ['https://addons.mozilla.org/en-US/firefox/', 'firefox_add_ons', 'Firefox'],
  ])('names %s as a store its browser keeps closed', (url, key, browser) => {
    expect(describeUnsupportedPage(url, 'unreachable')).toEqual({
      name: { key },
      reason: {
        key: 'browser_doesnt_allow_extensions_to_change_this_page',
        browser,
      },
      needsFileAccess: false,
    });
  });

  it('points a local file Stylebot cannot reach to the file access setting', () => {
    expect(
      describeUnsupportedPage('file:///Users/me/page.html', 'unreachable')
    ).toEqual({
      name: { key: 'local_file' },
      reason: { key: 'allow_file_url_access_to_style_local_files' },
      needsFileAccess: true,
    });
  });

  it('names a file on a website by its host', () => {
    expect(
      describeUnsupportedPage('https://example.com/report.pdf', 'unsupported')
    ).toEqual({
      name: null,
      reason: { key: 'stylebot_cant_style_this_page' },
      needsFileAccess: false,
    });
  });

  it('asks for a reload on a website that did not answer', () => {
    expect(
      describeUnsupportedPage('https://example.com', 'unreachable').reason
    ).toEqual({ key: 'reload_this_page_to_style_it' });
  });

  it('falls back to a browser page for view-source and data urls', () => {
    expect(
      describeUnsupportedPage('view-source:https://example.com', 'unreachable')
        .name
    ).toEqual({ key: 'browser_page' });
  });
});
