import { mount } from '@vue/test-utils';

import Readability from './Readability.vue';

describe('Readability.vue', () => {
  const tab = { id: 1 };

  beforeEach(() => {
    global.chrome = {
      tabs: {
        sendMessage: jest.fn(),
      },
    } as unknown as typeof chrome;
  });

  it('should show the shortcut chip when a shortcut is bound', () => {
    const wrapper = mount(Readability, {
      propsData: { tab, shortcut: 'alt+shift+r' },
    });

    expect(wrapper.find('kbd').exists()).toBe(true);
  });

  it('should show no chip with no shortcut bound', () => {
    const wrapper = mount(Readability, { propsData: { tab, shortcut: '' } });

    expect(wrapper.find('kbd').exists()).toBe(false);
  });

  it("should emit change and message the popup's own tab when toggled", async () => {
    const wrapper = mount(Readability, {
      propsData: { tab, initialReadability: false },
    });

    await wrapper.find('input[type="checkbox"]').setChecked(true);

    expect(wrapper.emitted('change')).toEqual([[true]]);
    expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(1, {
      name: 'ToggleReadabilityForTab',
    });
  });

  it('should re-sync from initialReadability when the prop changes', async () => {
    const wrapper = mount(Readability, {
      propsData: { tab, initialReadability: false },
    });

    await wrapper.setProps({ initialReadability: true });

    expect(
      (wrapper.find('input[type="checkbox"]').element as HTMLInputElement)
        .checked
    ).toBe(true);
  });
});
