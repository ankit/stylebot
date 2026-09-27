import { mount } from '@vue/test-utils';

import SShortcutChip from './SShortcutChip.vue';

describe('SShortcutChip.vue', () => {
  it('renders the formatted value and no "small" class by default', () => {
    const wrapper = mount(SShortcutChip, {
      propsData: { value: 'alt+shift+r' },
    });

    expect(wrapper.find('kbd').exists()).toBe(true);
    expect(wrapper.classes()).not.toContain('small');
  });

  it('applies the small class and forwards it to SShortcutKbd', () => {
    const wrapper = mount(SShortcutChip, {
      propsData: { value: 'alt+shift+r', small: true },
    });

    expect(wrapper.classes()).toContain('small');
    expect(wrapper.find('.shortcut-kbd').classes()).toContain('small');
  });
});
