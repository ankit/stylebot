import { mount } from '@vue/test-utils';

import PopupRow from './PopupRow.vue';

describe('PopupRow.vue', () => {
  it('should render slot content', () => {
    const wrapper = mount(PopupRow, { slots: { default: '<span>Hi</span>' } });

    expect(wrapper.text()).toBe('Hi');
  });

  it('should have button role and be focusable in button mode', () => {
    const wrapper = mount(PopupRow, { propsData: { button: true } });

    expect(wrapper.attributes('role')).toBe('button');
    expect(wrapper.attributes('tabindex')).toBe('0');
  });

  it('should emit click on click in button mode', async () => {
    const wrapper = mount(PopupRow, { propsData: { button: true } });

    await wrapper.trigger('click');

    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  it('should emit click on Enter/Space and ignore other keys in button mode', async () => {
    const wrapper = mount(PopupRow, { propsData: { button: true } });

    await wrapper.trigger('keydown', { key: 'Enter' });
    await wrapper.trigger('keydown', { key: ' ' });
    await wrapper.trigger('keydown', { key: 'Tab' });

    expect(wrapper.emitted('click')).toHaveLength(2);
  });

  it('should not emit click or expose tabindex when disabled in button mode', async () => {
    const wrapper = mount(PopupRow, {
      propsData: { button: true, disabled: true },
    });

    expect(wrapper.attributes('tabindex')).toBeUndefined();

    await wrapper.trigger('click');
    await wrapper.trigger('keydown', { key: 'Enter' });

    expect(wrapper.emitted('click')).toBeUndefined();
  });

  it('should forward a click on the row padding to the nested checkbox in hover mode', async () => {
    const wrapper = mount(PopupRow, {
      propsData: { hover: true },
      slots: {
        default: '<label><input type="checkbox" /><span>Label</span></label>',
      },
    });

    const input = wrapper.find('input').element as HTMLInputElement;
    const clickSpy = jest.spyOn(input, 'click');

    // Click the row itself, not the label/input — simulates clicking in
    // the row's padding, outside the label's own rendered box.
    await wrapper.trigger('click');

    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it('should not double-forward when the click already landed on the label in hover mode', async () => {
    const wrapper = mount(PopupRow, {
      propsData: { hover: true },
      slots: {
        default: '<label><input type="checkbox" /><span>Label</span></label>',
      },
    });

    const input = wrapper.find('input').element as HTMLInputElement;
    const clickSpy = jest.spyOn(input, 'click');

    await wrapper.find('label').trigger('click');

    expect(clickSpy).not.toHaveBeenCalled();
  });

  it('should not forward clicks when disabled in hover mode', async () => {
    const wrapper = mount(PopupRow, {
      propsData: { hover: true, disabled: true },
      slots: {
        default: '<label><input type="checkbox" /><span>Label</span></label>',
      },
    });

    const input = wrapper.find('input').element as HTMLInputElement;
    const clickSpy = jest.spyOn(input, 'click');

    await wrapper.trigger('click');

    expect(clickSpy).not.toHaveBeenCalled();
  });

  it('should emit click without exposing role/tabindex or forwarding in default mode', async () => {
    const wrapper = mount(PopupRow, {});

    expect(wrapper.attributes('role')).toBeUndefined();
    expect(wrapper.attributes('tabindex')).toBeUndefined();

    await wrapper.trigger('click');

    expect(wrapper.emitted('click')).toHaveLength(1);
  });
});
