import { mount } from '@vue/test-utils';

import ShortcutKeycap from '../ShortcutKeycap.vue';

describe('ShortcutKeycap.vue', () => {
  it('shows the keyboard icon and no recording class by default', () => {
    const wrapper = mount(ShortcutKeycap);

    expect(wrapper.classes()).not.toContain('recording');
    expect(wrapper.find('svg').exists()).toBe(true);
  });

  it('applies the recording class when the recording prop is true', () => {
    const wrapper = mount(ShortcutKeycap, { propsData: { recording: true } });

    expect(wrapper.classes()).toContain('recording');
  });

  it('emits click/hover/unhover', async () => {
    const wrapper = mount(ShortcutKeycap);

    await wrapper.trigger('click');
    expect(wrapper.emitted('click')).toHaveLength(1);

    await wrapper.trigger('mouseenter');
    expect(wrapper.emitted('hover')).toHaveLength(1);

    await wrapper.trigger('mouseleave');
    expect(wrapper.emitted('unhover')).toHaveLength(1);
  });
});
