import { mount } from '@vue/test-utils';

import TheSyncTab from './TheSyncTab.vue';

const mountTab = (state: Record<string, unknown>) =>
  mount(TheSyncTab, {
    stubs: { 'the-google-drive-sync': true },
    mocks: {
      $store: {
        state: {
          styles: {},
          googleDriveSyncEnabled: false,
          googleDriveSyncMetadata: undefined,
          syncInProgress: false,
          syncStatus: null,
          ...state,
        },
        dispatch: jest.fn(),
      },
    },
  });

describe('TheSyncTab.vue', () => {
  it('shows no banner when nothing has happened yet', () => {
    const wrapper = mountTab({});
    expect(wrapper.find('.banner').exists()).toBe(false);
  });

  it('shows an error banner carrying the failure key', () => {
    const wrapper = mountTab({
      syncStatus: {
        type: 'error',
        messageKey: 'sync_error_auth',
        detail: 'Authorization failure',
      },
    });

    const banner = wrapper.find('.banner');
    expect(banner.classes()).toContain('error');
    expect(banner.text()).toContain('sync_error_auth');
  });

  it('localizes its description instead of hardcoding English', () => {
    const wrapper = mountTab({});
    expect(wrapper.text()).toContain('sync_tab_description');
  });
});
