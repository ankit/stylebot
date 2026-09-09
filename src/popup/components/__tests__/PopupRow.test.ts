import { mount } from '@vue/test-utils';

import PopupRow from '../PopupRow.vue';

describe('PopupRow.vue', () => {
  it('renders slot content', () => {
    const wrapper = mount(PopupRow, { slots: { default: '<span>Hi</span>' } });

    expect(wrapper.text()).toBe('Hi');
  });

  describe('button mode', () => {
    it('has button role and is focusable', () => {
      const wrapper = mount(PopupRow, { propsData: { button: true } });

      expect(wrapper.attributes('role')).toBe('button');
      expect(wrapper.attributes('tabindex')).toBe('0');
    });

    it('emits click on click', async () => {
      const wrapper = mount(PopupRow, { propsData: { button: true } });

      await wrapper.trigger('click');

      expect(wrapper.emitted('click')).toHaveLength(1);
    });

    it('emits click on Enter/Space and ignores other keys', async () => {
      const wrapper = mount(PopupRow, { propsData: { button: true } });

      await wrapper.trigger('keydown', { key: 'Enter' });
      await wrapper.trigger('keydown', { key: ' ' });
      await wrapper.trigger('keydown', { key: 'Tab' });

      expect(wrapper.emitted('click')).toHaveLength(2);
    });

    it('does not emit click or expose tabindex when disabled', async () => {
      const wrapper = mount(PopupRow, {
        propsData: { button: true, disabled: true },
      });

      expect(wrapper.attributes('tabindex')).toBeUndefined();

      await wrapper.trigger('click');
      await wrapper.trigger('keydown', { key: 'Enter' });

      expect(wrapper.emitted('click')).toBeUndefined();
    });
  });

  describe('hover mode (wraps its own focusable control)', () => {
    it('forwards a click on the row padding to the nested checkbox', async () => {
      const wrapper = mount(PopupRow, {
        propsData: { hover: true },
        slots: {
          default:
            '<label><input type="checkbox" /><span>Label</span></label>',
        },
      });

      const input = wrapper.find('input').element as HTMLInputElement;
      const clickSpy = jest.spyOn(input, 'click');

      // Click the row itself, not the label/input — simulates clicking in
      // the row's padding, outside the label's own rendered box.
      await wrapper.trigger('click');

      expect(clickSpy).toHaveBeenCalledTimes(1);
    });

    it('does not double-forward when the click already landed on the label', async () => {
      const wrapper = mount(PopupRow, {
        propsData: { hover: true },
        slots: {
          default:
            '<label><input type="checkbox" /><span>Label</span></label>',
        },
      });

      const input = wrapper.find('input').element as HTMLInputElement;
      const clickSpy = jest.spyOn(input, 'click');

      await wrapper.find('label').trigger('click');

      expect(clickSpy).not.toHaveBeenCalled();
    });

    it('does nothing when disabled', async () => {
      const wrapper = mount(PopupRow, {
        propsData: { hover: true, disabled: true },
        slots: {
          default:
            '<label><input type="checkbox" /><span>Label</span></label>',
        },
      });

      const input = wrapper.find('input').element as HTMLInputElement;
      const clickSpy = jest.spyOn(input, 'click');

      await wrapper.trigger('click');

      expect(clickSpy).not.toHaveBeenCalled();
    });
  });

  describe('default mode (row itself is not the sole click target)', () => {
    it('emits click without role/tabindex or forwarding', async () => {
      const wrapper = mount(PopupRow, {});

      expect(wrapper.attributes('role')).toBeUndefined();
      expect(wrapper.attributes('tabindex')).toBeUndefined();

      await wrapper.trigger('click');

      expect(wrapper.emitted('click')).toHaveLength(1);
    });
  });
});
