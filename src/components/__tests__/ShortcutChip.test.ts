import { mount } from '@vue/test-utils';

import ShortcutChip from '../ShortcutChip.vue';

describe('ShortcutChip.vue', () => {
  it('renders the formatted value and no "small" class by default', () => {
    const wrapper = mount(ShortcutChip, { propsData: { value: 'alt+shift+r' } });

    expect(wrapper.find('kbd').exists()).toBe(true);
    expect(wrapper.classes()).not.toContain('small');
  });

  it('applies the small class and forwards it to ShortcutKbd', () => {
    const wrapper = mount(ShortcutChip, { propsData: { value: 'alt+shift+r', small: true } });

    expect(wrapper.classes()).toContain('small');
    expect(wrapper.find('.shortcut-kbd').classes()).toContain('small');
  });
});
