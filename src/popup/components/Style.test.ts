import { mount } from '@vue/test-utils';

import Style from './Style.vue';

const stub = { template: '<div><slot /></div>' };

describe('Style.vue', () => {
  beforeEach(() => {
    global.chrome = {
      runtime: {
        sendMessage: jest.fn(),
      },
    } as unknown as typeof chrome;
  });

  it('should forward a click on the header padding to the nested checkbox in header mode', async () => {
    const wrapper = mount(Style, {
      propsData: { url: 'example.com', header: true },
      stubs: { ShortcutChip: stub },
    });

    const input = wrapper.find('input').element as HTMLInputElement;
    const clickSpy = jest.spyOn(input, 'click');

    // Click the header container itself, not the label/input — simulates
    // clicking the padding above/below the toggle's own hit target.
    await wrapper.find('.popup-header').trigger('click');

    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it('should not double-forward when the click already landed on the label in header mode', async () => {
    const wrapper = mount(Style, {
      propsData: { url: 'example.com', header: true },
      stubs: { ShortcutChip: stub },
    });

    const input = wrapper.find('input').element as HTMLInputElement;
    const clickSpy = jest.spyOn(input, 'click');

    await wrapper.find('label').trigger('click');

    expect(clickSpy).not.toHaveBeenCalled();
  });

  it('should not forward clicks when disabled in header mode', async () => {
    const wrapper = mount(Style, {
      propsData: { url: 'example.com', header: true, disableToggle: true },
      stubs: { ShortcutChip: stub },
    });

    const input = wrapper.find('input').element as HTMLInputElement;
    const clickSpy = jest.spyOn(input, 'click');

    await wrapper.find('.popup-header').trigger('click');

    expect(clickSpy).not.toHaveBeenCalled();
  });
});
