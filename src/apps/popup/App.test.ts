import { shallowMount } from '@vue/test-utils';

import App from './App.vue';
import OptionsButton from './components/OptionsButton.vue';
import SiteProfiles from './components/SiteProfiles.vue';
import StyleComponent from './components/Style.vue';
import ToggleStylebot from './components/ToggleStylebot.vue';
import SyncStylebot from './components/SyncStylebot.vue';
import UnsupportedPage from './components/UnsupportedPage.vue';
import { getCurrentTab, getStyles, getCommands } from './utils';
import { getPageSupport } from '@stylebot/utils';
import type { PageSupport } from '@stylebot/utils';
import { getGoogleDriveSyncEnabled } from '../../features/sync/google-drive/sync-metadata';

jest.mock('./utils', () => ({
  getCurrentTab: jest.fn(),
  getStyles: jest.fn(),
  getCommands: jest.fn(),
  getOption: jest.fn(),
  getIsStylebotOpen: jest.fn(),
  getIsPageReaderable: jest.fn(),
}));

jest.mock('@stylebot/utils', () => ({
  ...jest.requireActual('@stylebot/utils'),
  getPageSupport: jest.fn(),
}));

jest.mock('../../features/sync/google-drive/sync-metadata', () => ({
  getGoogleDriveSyncEnabled: jest.fn(),
}));

const flush = () => new Promise(resolve => setTimeout(resolve));

const syncStatus = (enabled: boolean) =>
  (getGoogleDriveSyncEnabled as jest.Mock).mockResolvedValue(enabled);

/**
 * Opens the popup on a tab at `url` whose page script gives `support`, and
 * waits for it to settle.
 */
const openPopup = async (url: string, support: PageSupport = 'supported') => {
  (getCurrentTab as jest.Mock).mockImplementation(cb =>
    cb({ id: 1, url } as chrome.tabs.Tab)
  );
  (getPageSupport as jest.Mock).mockResolvedValue(support);

  const wrapper = shallowMount(App);
  await flush();
  return wrapper;
};

describe('App.vue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    syncStatus(false);
  });

  it('should show the restricted view for a browser page', async () => {
    const wrapper = await openPopup('chrome://extensions', 'unreachable');

    expect(wrapper.findComponent(UnsupportedPage).exists()).toBe(true);
  });

  it('should show the restricted view for a page Stylebot cannot style', async () => {
    const wrapper = await openPopup(
      'https://example.com/report.pdf',
      'unsupported'
    );

    expect(wrapper.findComponent(UnsupportedPage).props('support')).toBe(
      'unsupported'
    );
  });

  it('should show the restricted view for a page whose script did not answer', async () => {
    const wrapper = await openPopup('https://example.com', 'unreachable');

    expect(wrapper.findComponent(UnsupportedPage).exists()).toBe(true);
  });

  it('should style a page at a url ending in .pdf when the page says it can', async () => {
    const wrapper = await openPopup('https://example.com/entry/report.pdf');

    expect(wrapper.findComponent(UnsupportedPage).exists()).toBe(false);
    expect(getStyles).toHaveBeenCalled();
  });

  it('should skip fetching page state for restricted pages', async () => {
    await openPopup('chrome://extensions', 'unreachable');

    expect(getStyles).not.toHaveBeenCalled();
  });

  it('should show the settings button on the main view', async () => {
    const wrapper = await openPopup('https://news.ycombinator.com');

    expect(wrapper.findComponent(OptionsButton).exists()).toBe(true);
  });

  it('should fetch keyboard shortcuts on load', async () => {
    await openPopup('https://news.ycombinator.com');

    expect(getCommands).toHaveBeenCalled();
  });

  it('should show the sync strip while sync is on', async () => {
    syncStatus(true);
    const wrapper = await openPopup('https://news.ycombinator.com');

    expect(wrapper.findComponent(SyncStylebot).exists()).toBe(true);
  });

  it('should hide the sync strip while sync is off', async () => {
    syncStatus(false);
    const wrapper = await openPopup('https://news.ycombinator.com');

    expect(wrapper.findComponent(SyncStylebot).exists()).toBe(false);
  });

  it('should reload the styles once a sync lands', async () => {
    syncStatus(true);
    const wrapper = await openPopup('https://news.ycombinator.com');

    wrapper.findComponent(SyncStylebot).vm.$emit('synced');

    expect(getStyles).toHaveBeenCalledTimes(2);
  });

  it('should list every matching style as a row, the most specific first, whatever its save order', async () => {
    const style = (url: string) => ({
      url,
      css: 'a { color: red; }',
      enabled: true,
      readability: false,
    });
    const broad = {
      ...style('google.com'),
      activeProfile: 'minimalist',
      profiles: {
        default: { name: '', css: 'a { color: red; }' },
        minimalist: { name: 'Minimalist', css: 'a { color: blue; }' },
      },
    };
    const own = style('www.google.com');

    (getStyles as jest.Mock).mockImplementation((_tab, cb) =>
      cb({ styles: [broad, own], defaultStyle: own })
    );

    const wrapper = await openPopup('https://www.google.com/');

    expect(wrapper.findComponent(SiteProfiles).exists()).toBe(false);
    expect(
      wrapper
        .findAllComponents(StyleComponent)
        .wrappers.map(row => row.props('url'))
    ).toEqual(['www.google.com', 'google.com']);
    expect(wrapper.findComponent(ToggleStylebot).props('profileName')).toBe(
      'www.google.com'
    );
  });
});
