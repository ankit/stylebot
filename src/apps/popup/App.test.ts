import { shallowMount } from '@vue/test-utils';

import App from './App.vue';
import PopupMoreMenu from './components/PopupMoreMenu.vue';
import SiteProfiles from './components/SiteProfiles.vue';
import StyleComponent from './components/Style.vue';
import ToggleStylebot from './components/ToggleStylebot.vue';
import SyncStylebot from './components/SyncStylebot.vue';
import UnsupportedPage from './components/UnsupportedPage.vue';
import {
  getCurrentTab,
  getIsStylebotOpen,
  getStyles,
  getCommands,
  getRestoredPageSupport,
  deleteProfile,
  disableStyle,
} from './utils';
import type { PageSupport } from '@stylebot/utils';
import { getGoogleDriveSyncEnabled } from '../../features/sync/google-drive/sync-metadata';

jest.mock('./utils', () => ({
  getCurrentTab: jest.fn(),
  getStyles: jest.fn(),
  getCommands: jest.fn(),
  getOption: jest.fn(),
  getIsStylebotOpen: jest.fn(),
  getIsPageReaderable: jest.fn(),
  getRestoredPageSupport: jest.fn(),
  getPublishMenuItem: jest.fn(async () => null),
  deleteProfile: jest.fn(),
  disableStyle: jest.fn(),
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
  (getRestoredPageSupport as jest.Mock).mockResolvedValue(support);

  const wrapper = shallowMount(App);
  await flush();
  return wrapper;
};

/**
 * Opens the popup on a tab whose page script hasn't answered yet, returning
 * the way to answer for it.
 */
const openPopupOnBusyPage = (url: string) => {
  let answer: (support: PageSupport) => void = () => undefined;

  (getCurrentTab as jest.Mock).mockImplementation(cb =>
    cb({ id: 1, url } as chrome.tabs.Tab)
  );
  (getRestoredPageSupport as jest.Mock).mockReturnValue(
    new Promise<PageSupport>(resolve => {
      answer = resolve;
    })
  );

  return { wrapper: shallowMount(App), answer };
};

describe('App.vue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    syncStatus(false);
  });

  describe('on a page too busy to answer', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    const settle = async () => {
      for (let i = 0; i < 5; i++) {
        await Promise.resolve();
      }
    };

    it('should show the usual view without waiting for it', async () => {
      const { wrapper } = openPopupOnBusyPage('https://www.reddit.com/');

      expect(wrapper.findComponent(ToggleStylebot).exists()).toBe(false);

      jest.advanceTimersByTime(100);
      await settle();

      expect(wrapper.findComponent(ToggleStylebot).exists()).toBe(true);
    });

    it('should load the page once when it answers late', async () => {
      const { answer } = openPopupOnBusyPage('https://www.reddit.com/');

      jest.advanceTimersByTime(100);
      answer('supported');
      await settle();

      expect(getIsStylebotOpen).toHaveBeenCalledTimes(1);
      expect(getStyles).toHaveBeenCalledTimes(1);
    });

    it('should correct the view when it answers late that it cannot be styled', async () => {
      const { wrapper, answer } = openPopupOnBusyPage(
        'https://example.com/report.pdf'
      );

      jest.advanceTimersByTime(100);
      await settle();
      answer('unsupported');
      await settle();

      expect(wrapper.findComponent(UnsupportedPage).exists()).toBe(true);
    });

    it('should not stand in for a browser page', async () => {
      const { wrapper } = openPopupOnBusyPage('chrome://extensions');

      jest.advanceTimersByTime(100);
      await settle();

      expect(wrapper.findComponent(ToggleStylebot).exists()).toBe(false);
    });
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

    expect(wrapper.findComponent(PopupMoreMenu).exists()).toBe(true);
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

  it('should turn the style off before deleting its active profile, so the page never gets the next one', async () => {
    const site = {
      url: 'example.com',
      css: 'a { color: red; }',
      enabled: true,
      readability: false,
      activeProfile: 'dark',
      profiles: {
        default: { name: '', css: 'a { color: blue; }' },
        dark: { name: 'Dark' },
      },
    };

    (getStyles as jest.Mock).mockImplementation((_tab, cb) =>
      cb({ styles: [site], defaultStyle: site })
    );

    const wrapper = await openPopup('https://example.com/');
    wrapper.findComponent(SiteProfiles).vm.$emit('delete', 'dark');

    const disabled = (disableStyle as jest.Mock).mock.invocationCallOrder[0];
    const deleted = (deleteProfile as jest.Mock).mock.invocationCallOrder[0];

    expect(disabled).toBeLessThan(deleted);
  });
});
