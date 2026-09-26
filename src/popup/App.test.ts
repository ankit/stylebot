import { shallowMount } from '@vue/test-utils';

import App from './App.vue';
import SettingsButton from './components/SettingsButton.vue';
import SyncStylebot from './components/SyncStylebot.vue';
import { getCurrentTab, getStyles, getCommands } from './utils';
import {
  getGoogleDriveSyncEnabled,
  getSyncNeedsAuth,
} from '../sync/google-drive/sync-metadata';

jest.mock('./utils', () => ({
  getCurrentTab: jest.fn(),
  getStyles: jest.fn(),
  getCommands: jest.fn(),
  getOption: jest.fn(),
  getIsStylebotOpen: jest.fn(),
  getIsPageReaderable: jest.fn(),
}));

jest.mock('../sync/google-drive/sync-metadata', () => ({
  getGoogleDriveSyncEnabled: jest.fn(),
  getSyncNeedsAuth: jest.fn(),
}));

const flush = () => new Promise(resolve => setTimeout(resolve));

const syncStatus = (enabled: boolean, needsAuth: boolean) => {
  (getGoogleDriveSyncEnabled as jest.Mock).mockResolvedValue(enabled);
  (getSyncNeedsAuth as jest.Mock).mockResolvedValue(needsAuth);
};

const currentTab = (url: string) =>
  (getCurrentTab as jest.Mock).mockImplementation(cb =>
    cb({ id: 1, url } as chrome.tabs.Tab)
  );

describe('App.vue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    syncStatus(false, false);
  });

  it('should show the restricted message for chrome:// pages', () => {
    currentTab('chrome://extensions');
    const wrapper = shallowMount(App);

    expect(wrapper.find('.popup-restricted-message').exists()).toBe(true);
  });

  it('should show the restricted message for the Chrome Web Store', () => {
    currentTab('https://chrome.google.com/webstore/detail/foo');
    const wrapper = shallowMount(App);

    expect(wrapper.find('.popup-restricted-message').exists()).toBe(true);
  });

  it('should show the restricted message for a PDF document', () => {
    currentTab('https://example.com/report.pdf');
    const wrapper = shallowMount(App);

    expect(wrapper.find('.popup-restricted-message').exists()).toBe(true);
  });

  it('should not show the restricted message for an ordinary web page', () => {
    currentTab('https://news.ycombinator.com');
    const wrapper = shallowMount(App);

    expect(wrapper.find('.popup-restricted-message').exists()).toBe(false);
  });

  it('should skip fetching page state for restricted pages', () => {
    currentTab('chrome://extensions');
    shallowMount(App);

    expect(getStyles).not.toHaveBeenCalled();
  });

  it('should fetch page state for ordinary pages', () => {
    currentTab('https://news.ycombinator.com');
    shallowMount(App);

    expect(getStyles).toHaveBeenCalled();
  });

  it('should show the settings button on the main view', () => {
    currentTab('https://news.ycombinator.com');
    const wrapper = shallowMount(App);

    expect(wrapper.findComponent(SettingsButton).exists()).toBe(true);
  });

  it('should not show the settings button on the restricted view', () => {
    currentTab('chrome://extensions');
    const wrapper = shallowMount(App);

    expect(wrapper.findComponent(SettingsButton).exists()).toBe(false);
  });

  it('should fetch keyboard shortcuts on load', () => {
    currentTab('https://news.ycombinator.com');
    shallowMount(App);

    expect(getCommands).toHaveBeenCalled();
  });

  it('should hide the sync strip while sync is healthy', async () => {
    currentTab('https://news.ycombinator.com');
    syncStatus(true, false);
    const wrapper = shallowMount(App);
    await flush();

    expect(wrapper.findComponent(SyncStylebot).exists()).toBe(false);
  });

  it('should show the sync strip when a scheduled sync needs a sign-in', async () => {
    currentTab('https://news.ycombinator.com');
    syncStatus(true, true);
    const wrapper = shallowMount(App);
    await flush();

    expect(wrapper.findComponent(SyncStylebot).exists()).toBe(true);
  });

  it('should ignore a stale sign-in flag once sync is off', async () => {
    currentTab('https://news.ycombinator.com');
    syncStatus(false, true);
    const wrapper = shallowMount(App);
    await flush();

    expect(wrapper.findComponent(SyncStylebot).exists()).toBe(false);
  });
});
