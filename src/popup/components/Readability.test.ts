import { mount } from '@vue/test-utils';

import Readability from './Readability.vue';

describe('Readability.vue', () => {
  beforeEach(() => {
    global.chrome = {
      tabs: {
        query: jest.fn((_query, callback) => callback([{ id: 1 }])),
        sendMessage: jest.fn(),
      },
    } as unknown as typeof chrome;
  });

  it('should show "articles only" and no shortcut chip when disabled', () => {
    const wrapper = mount(Readability, {
      propsData: { disabled: true, shortcut: 'alt+shift+r' },
    });

    expect(wrapper.text()).toContain('articles_only');
    expect(wrapper.find('kbd').exists()).toBe(false);
  });

  it('should show the shortcut chip when enabled and a shortcut is bound', () => {
    const wrapper = mount(Readability, {
      propsData: { disabled: false, shortcut: 'alt+shift+r' },
    });

    expect(wrapper.find('kbd').exists()).toBe(true);
    expect(wrapper.text()).not.toContain('articles_only');
  });

  it('should show neither when enabled with no shortcut bound', () => {
    const wrapper = mount(Readability, {
      propsData: { disabled: false, shortcut: '' },
    });

    expect(wrapper.find('kbd').exists()).toBe(false);
    expect(wrapper.text()).not.toContain('articles_only');
  });

  it('should emit change and message the active tab when toggled', async () => {
    const wrapper = mount(Readability, {
      propsData: { initialReadability: false, disabled: false },
    });

    await wrapper.find('input[type="checkbox"]').setChecked(true);

    expect(wrapper.emitted('change')).toEqual([[true]]);
    expect(chrome.tabs.query).toHaveBeenCalledWith(
      { active: true },
      expect.any(Function)
    );
    expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(1, {
      name: 'ToggleReadabilityForTab',
    });
  });

  it('should re-sync from initialReadability when the prop changes', async () => {
    const wrapper = mount(Readability, {
      propsData: { initialReadability: false, disabled: false },
    });

    await wrapper.setProps({ initialReadability: true });

    expect(
      (wrapper.find('input[type="checkbox"]').element as HTMLInputElement)
        .checked
    ).toBe(true);
  });
});
