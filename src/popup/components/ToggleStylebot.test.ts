import { mount } from '@vue/test-utils';

import ToggleStylebot from './ToggleStylebot.vue';
import { toggleStylebot } from '../utils';

jest.mock('../utils', () => ({
  toggleStylebot: jest.fn(),
}));

const tab = { id: 1 } as chrome.tabs.Tab;

describe('ToggleStylebot.vue', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should show the "style this page" label when closed', () => {
    const wrapper = mount(ToggleStylebot, {
      propsData: { tab, isOpen: false },
    });

    expect(wrapper.text()).toContain('style_this_page');
    expect(wrapper.text()).not.toContain('close_stylebot');
  });

  it('should show the "close" label when open', () => {
    const wrapper = mount(ToggleStylebot, {
      propsData: { tab, isOpen: true },
    });

    expect(wrapper.text()).toContain('close_stylebot');
    expect(wrapper.text()).not.toContain('style_this_page');
  });

  it('should call toggleStylebot with the tab on click', async () => {
    const wrapper = mount(ToggleStylebot, {
      propsData: { tab, isOpen: false },
    });

    await wrapper.find('button').trigger('click');

    expect(toggleStylebot).toHaveBeenCalledWith(tab);
  });

  it('should show the shortcut chip only when a shortcut is bound', () => {
    const withShortcut = mount(ToggleStylebot, {
      propsData: { tab, isOpen: false, shortcut: 'alt+shift+m' },
    });
    const withoutShortcut = mount(ToggleStylebot, {
      propsData: { tab, isOpen: false },
    });

    expect(withShortcut.find('kbd').exists()).toBe(true);
    expect(withoutShortcut.find('kbd').exists()).toBe(false);
  });
});
