import { mount } from '@vue/test-utils';

import Style from './Style.vue';

describe('Style.vue', () => {
  beforeEach(() => {
    global.chrome = {
      runtime: { sendMessage: jest.fn() },
    } as unknown as typeof chrome;
  });

  it("labels the page's own style Style until it has a name", () => {
    const wrapper = mount(Style, {
      propsData: { url: 'example.com', site: true, shortcut: 'alt+shift+s' },
    });

    expect(wrapper.text()).toContain('style');
    expect(wrapper.text()).not.toContain('example.com');
  });

  it("labels the page's own style with its name once it has one", () => {
    const wrapper = mount(Style, {
      propsData: { url: 'example.com', site: true, name: 'Dracula' },
    });

    expect(wrapper.text()).toContain('Dracula');
  });

  it('labels any other style with its url', () => {
    const wrapper = mount(Style, { propsData: { url: '*.example.com' } });

    expect(wrapper.text()).toContain('*.example.com');
  });
});
