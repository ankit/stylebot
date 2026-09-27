import { mount } from '@vue/test-utils';

import SyncStylebot from './SyncStylebot.vue';
import { openSyncOptions } from '../utils';

jest.mock('../utils', () => ({
  openSyncOptions: jest.fn(),
}));

describe('SyncStylebot.vue', () => {
  it('asks for a sign-in', () => {
    const wrapper = mount(SyncStylebot);

    expect(wrapper.text()).toContain('sync_needs_sign_in');
  });

  it('opens the Sync tab when clicked', async () => {
    const wrapper = mount(SyncStylebot);

    await wrapper.trigger('click');

    expect(openSyncOptions).toHaveBeenCalled();
  });
});
