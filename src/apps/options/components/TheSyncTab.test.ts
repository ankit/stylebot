import { mount } from '@vue/test-utils';

import { openReportIssuePage } from '@stylebot/utils';

import TheSyncTab from './TheSyncTab.vue';

jest.mock('@stylebot/utils', () => ({
  ...jest.requireActual('@stylebot/utils'),
  openReportIssuePage: jest.fn(),
}));

const stylesBeforeV4 = {
  'example.com': {
    css: 'a { color: red; }',
    enabled: true,
    readability: false,
    modifiedTime: '2026-09-01T10:00:00.000Z',
  },
};

const flushPromises = () => new Promise(resolve => setTimeout(resolve));

const mountTab = (
  state: Record<string, unknown>,
  stored: Record<string, unknown> = {}
) => {
  global.chrome = {
    storage: {
      local: { get: jest.fn(async (key: string) => ({ [key]: stored[key] })) },
    },
  } as unknown as typeof chrome;

  return mount(TheSyncTab, {
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
};

const restoreButton = (wrapper: ReturnType<typeof mountTab>) =>
  wrapper
    .findAll('button')
    .filter(button => button.text() === 'restore_styles_from_before_4_0');

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

  it('offers no restore without styles backed up before 4.0', async () => {
    const wrapper = mountTab({}, { backup_before_v4: { items: {} } });
    await flushPromises();

    expect(restoreButton(wrapper)).toHaveLength(0);
  });

  it('restores the styles backed up before 4.0', async () => {
    const wrapper = mountTab(
      {},
      {
        backup_before_v4: {
          createdAt: new Date().toISOString(),
          items: { styles: stylesBeforeV4 },
        },
      }
    );
    await flushPromises();

    await restoreButton(wrapper).at(0).trigger('click');

    expect(wrapper.vm.$store.dispatch).toBeCalledWith(
      'setAllStyles',
      stylesBeforeV4
    );
    expect(wrapper.text()).toContain('restore_success');
  });

  it('says when the styles from before 4.0 were backed up', async () => {
    const wrapper = mountTab(
      {},
      {
        backup_before_v4: {
          createdAt: '2026-10-01T10:00:00.000Z',
          items: { styles: stylesBeforeV4 },
        },
      }
    );
    await flushPromises();

    expect(wrapper.text()).toContain('backed_up_time');
  });

  it('reports failed migrations with a way to report the issue', async () => {
    const wrapper = mountTab(
      {},
      { migration_errors: { 'styles-metadata-update': 'quota' } }
    );
    await flushPromises();

    const banner = wrapper.find('.banner.error');
    expect(banner.text()).toContain(
      'some_of_your_saved_data_could_not_be_updated'
    );

    await banner.find('button').trigger('click');
    expect(openReportIssuePage).toBeCalled();
  });

  it('shows no migration banner after a clean start', async () => {
    const wrapper = mountTab({}, {});
    await flushPromises();

    expect(wrapper.find('.banner').exists()).toBe(false);
  });
});
