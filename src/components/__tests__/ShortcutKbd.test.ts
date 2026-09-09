import { mount } from '@vue/test-utils';

jest.mock('../utils/format-shortcut', () => ({
  formatShortcut: jest.fn(),
}));

import { formatShortcut } from '../utils/format-shortcut';
import ShortcutKbd from '../ShortcutKbd.vue';

describe('ShortcutKbd.vue', () => {
  it('renders one <kbd> per part with the joiner between them', () => {
    (formatShortcut as jest.Mock).mockReturnValue({ parts: ['Alt', 'Shift', 'R'], joiner: '+' });

    const wrapper = mount(ShortcutKbd, { propsData: { value: 'alt+shift+r' } });
    const kbds = wrapper.findAll('kbd');

    expect(kbds.length).toBe(3);
    expect(kbds.at(0).text()).toBe('Alt');
    expect(kbds.at(1).text()).toBe('Shift');
    expect(kbds.at(2).text()).toBe('R');
    expect(wrapper.findAll('.joiner').length).toBe(2);
  });

  it('renders empty separators when the joiner is empty', () => {
    (formatShortcut as jest.Mock).mockReturnValue({ parts: ['⌥', '⇧', 'R'], joiner: '' });

    const wrapper = mount(ShortcutKbd, { propsData: { value: 'alt+shift+r' } });

    expect(wrapper.findAll('kbd').length).toBe(3);
    wrapper.findAll('.joiner').wrappers.forEach(joiner => {
      expect(joiner.text()).toBe('');
    });
  });
});
