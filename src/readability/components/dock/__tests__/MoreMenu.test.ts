import { mount } from '@vue/test-utils';

import { shortcutStore } from '../shortcut-store';
import MoreMenu from '../MoreMenu.vue';

jest.mock('@stylebot/utils', () => ({
  openOptionsPage: jest.fn(),
  openReportIssuePage: jest.fn(),
  openDonatePage: jest.fn(),
}));

describe('MoreMenu.vue', () => {
  beforeEach(() => {
    shortcutStore.state.commands = { readability: '', style: '', stylebot: '', grayscale: '' };
  });

  it('shows "set_shortcut" with no chip when unset', () => {
    const wrapper = mount(MoreMenu);

    expect(wrapper.text()).toContain('set_shortcut');
    expect(wrapper.text()).not.toContain('modify_shortcut');
    expect(wrapper.find('.chip').exists()).toBe(false);
  });

  it('shows "modify_shortcut" with the current combo chip when set', () => {
    shortcutStore.state.commands = {
      readability: 'alt+shift+r',
      style: '',
      stylebot: '',
      grayscale: '',
    };

    const wrapper = mount(MoreMenu);

    expect(wrapper.text()).toContain('modify_shortcut');
    expect(wrapper.find('.chip').exists()).toBe(true);
  });

  it('emits open-shortcut when the row is clicked', async () => {
    const wrapper = mount(MoreMenu);

    await wrapper.findAll('.item').at(0).trigger('click');

    expect(wrapper.emitted('open-shortcut')).toHaveLength(1);
  });

  it('emits close (not open-shortcut) for the other items', async () => {
    const wrapper = mount(MoreMenu);

    await wrapper.findAll('.item').at(1).trigger('click'); // Options

    expect(wrapper.emitted('close')).toHaveLength(1);
    expect(wrapper.emitted('open-shortcut')).toBeUndefined();
  });
});
