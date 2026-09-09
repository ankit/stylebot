import { shallowMount } from '@vue/test-utils';

import App from './App.vue';
import MoreButton from './components/MoreButton.vue';
import PopupMoreMenu from './components/PopupMoreMenu.vue';
import { getCurrentTab, getStyles, getCommands } from './utils';

jest.mock('./utils', () => ({
  getCurrentTab: jest.fn(),
  getStyles: jest.fn(),
  getCommands: jest.fn(),
  getOptions: jest.fn(),
  getIsStylebotOpen: jest.fn(),
  getIsPageReaderable: jest.fn(),
}));

jest.mock('../sync/google-drive/sync-metadata', () => ({
  getGoogleDriveSyncEnabled: jest.fn().mockResolvedValue(false),
}));

const currentTab = (url: string) =>
  (getCurrentTab as jest.Mock).mockImplementation(cb =>
    cb({ id: 1, url } as chrome.tabs.Tab)
  );

describe('App.vue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

  it('should start on the main view', () => {
    currentTab('https://news.ycombinator.com');
    const wrapper = shallowMount(App);

    expect(wrapper.findComponent(PopupMoreMenu).exists()).toBe(false);
  });

  it('should switch to the More menu when the more button is clicked', async () => {
    currentTab('https://news.ycombinator.com');
    const wrapper = shallowMount(App);

    await wrapper.findComponent(MoreButton).vm.$emit('click');

    expect(wrapper.findComponent(PopupMoreMenu).exists()).toBe(true);
  });

  it('should return to the main view on "back"', async () => {
    currentTab('https://news.ycombinator.com');
    const wrapper = shallowMount(App);

    await wrapper.findComponent(MoreButton).vm.$emit('click');
    await wrapper.findComponent(PopupMoreMenu).vm.$emit('back');

    expect(wrapper.findComponent(PopupMoreMenu).exists()).toBe(false);
    expect(wrapper.findComponent(MoreButton).exists()).toBe(true);
  });

  it('should show the More menu from the restricted view too', async () => {
    currentTab('chrome://extensions');
    const wrapper = shallowMount(App);

    await wrapper.findComponent(MoreButton).vm.$emit('click');

    expect(wrapper.findComponent(PopupMoreMenu).exists()).toBe(true);
  });

  it('should fetch keyboard shortcuts on load', () => {
    currentTab('https://news.ycombinator.com');
    shallowMount(App);

    expect(getCommands).toHaveBeenCalled();
  });
});
