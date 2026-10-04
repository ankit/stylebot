import { mount } from '@vue/test-utils';

import UnsupportedPage from './UnsupportedPage.vue';
import OptionsButton from './OptionsButton.vue';
import { openExtensionDetails } from '../utils';

jest.mock('../utils', () => ({
  openExtensionDetails: jest.fn(),
  openOptions: jest.fn(),
}));

describe('UnsupportedPage.vue', () => {
  it('names the page, says why, and offers settings', () => {
    const wrapper = mount(UnsupportedPage, {
      propsData: { url: 'chrome://settings', support: 'unreachable' },
    });

    expect(wrapper.text()).toContain('browser_settings');
    expect(wrapper.text()).toContain('stylebot_cant_style_browser_pages');
    expect(wrapper.findComponent(OptionsButton).exists()).toBe(true);
  });

  it('names a website file by its host', () => {
    const wrapper = mount(UnsupportedPage, {
      propsData: {
        url: 'https://example.com/report.pdf',
        support: 'unsupported',
      },
    });

    expect(wrapper.text()).toContain('example.com');
  });

  it('links a local file to the file access setting', async () => {
    const wrapper = mount(UnsupportedPage, {
      propsData: { url: 'file:///Users/me/page.html', support: 'unreachable' },
    });

    await wrapper.find('.file-access-link').trigger('click');

    expect(openExtensionDetails).toHaveBeenCalled();
  });
});
