import { createLocalVue, mount, Wrapper } from '@vue/test-utils';
import Vue from 'vue';
import Vuex from 'vuex';
import VueRouter from 'vue-router';

import { defaultCommands, defaultOptions } from '@stylebot/settings';

import App from '../App.vue';
import { createRouter } from '../router';

jest.mock('@stylebot/i18n', () => ({ t: (key: string) => key }));

const localVue = createLocalVue();
localVue.use(Vuex);
localVue.use(VueRouter);

const ACTIONS = [
  'getAllStyles',
  'getAllOptions',
  'getCommands',
  'getGoogleDriveSyncMetadata',
  'saveStyle',
  'deleteStyle',
  'enableStyle',
  'disableStyle',
];

const createStore = () =>
  new Vuex.Store({
    state: {
      styles: {
        'example.com': {
          css: 'h1 { color: red; }',
          enabled: true,
          readability: false,
          modifiedTime: '2026-01-10T09:30:00Z',
        },
      },
      options: { ...defaultOptions, appearance: 'light' },
      commands: defaultCommands,
      googleDriveSyncEnabled: false,
      googleDriveSyncMetadata: undefined,
    },
    actions: Object.fromEntries(ACTIONS.map(name => [name, jest.fn()])),
  });

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

beforeEach(() => {
  // App subscribes to storage changes so background syncs refresh the page.
  global.chrome = {
    storage: { onChanged: { addListener: jest.fn() } },
  } as unknown as typeof chrome;
});

const mountApp = async (initialRoute = '/') => {
  const router = createRouter('abstract');
  await router.replace(initialRoute).catch(() => undefined);

  const wrapper = mount(App, {
    localVue,
    router,
    store: createStore(),
    mocks: { t: (key: string) => key },
    stubs: { CodeEditorIframe: true, TheNavigationFooter: true },
  });

  await flush();
  return { wrapper, router };
};

const navItem = (wrapper: Wrapper<Vue>, label: string) =>
  wrapper
    .findAll('.nav-item')
    .filter(w => w.text() === label)
    .at(0);

describe('options App routing', () => {
  it('redirects the root and unknown routes to basics', async () => {
    const { wrapper, router } = await mountApp('/');
    expect(router.currentRoute.name).toBe('basics');
    expect(navItem(wrapper, 'basics_options').classes()).toContain('active');

    await router.push('/nope').catch(() => undefined);
    expect(router.currentRoute.name).toBe('basics');
  });

  it('switches route when a sidebar tab is selected', async () => {
    const { wrapper, router } = await mountApp();

    await navItem(wrapper, 'styles_options').trigger('click');
    await flush();

    expect(router.currentRoute.name).toBe('styles');
    expect(navItem(wrapper, 'styles_options').classes()).toContain('active');
  });

  it('opens the editor with the url as a query param and marks styles active', async () => {
    const { wrapper, router } = await mountApp('/styles');

    wrapper
      .findComponent({ name: 'TheStylesTab' })
      .vm.$emit('edit', 'example.com');
    await flush();

    expect(router.currentRoute.name).toBe('style-edit');
    expect(router.currentRoute.query.url).toBe('example.com');
    expect(navItem(wrapper, 'styles_options').classes()).toContain('active');
    expect((wrapper.find('.url-input').element as HTMLInputElement).value).toBe(
      'example.com'
    );
  });

  it('opens a blank editor for a new style', async () => {
    const { wrapper, router } = await mountApp('/styles');

    wrapper.findComponent({ name: 'TheStylesTab' }).vm.$emit('edit', '');
    await flush();

    expect(router.currentRoute.name).toBe('style-edit');
    expect(router.currentRoute.query.url).toBeUndefined();
    expect((wrapper.find('.url-input').element as HTMLInputElement).value).toBe(
      ''
    );
  });

  it('holds navigation away from a dirty editor behind the confirm dialog', async () => {
    const { wrapper, router } = await mountApp('/styles/edit?url=example.com');

    await wrapper.find('.url-input').setValue('changed.com');
    router.push('/basics').catch(() => undefined);
    await flush();

    expect(router.currentRoute.name).toBe('style-edit');
    const dialog = wrapper.findComponent({ name: 'ConfirmDialog' });
    expect(dialog.exists()).toBe(true);

    dialog.vm.$emit('cancel');
    await flush();
    expect(router.currentRoute.name).toBe('style-edit');
    expect(wrapper.findComponent({ name: 'ConfirmDialog' }).exists()).toBe(
      false
    );

    router.push('/basics').catch(() => undefined);
    await flush();
    wrapper.findComponent({ name: 'ConfirmDialog' }).vm.$emit('confirm');
    await flush();

    expect(router.currentRoute.name).toBe('basics');
  });

  it('lets a clean editor go back without prompting', async () => {
    const { wrapper, router } = await mountApp('/styles/edit?url=example.com');

    wrapper.findComponent({ name: 'TheStyleEditorPage' }).vm.$emit('back');
    await flush();

    expect(router.currentRoute.name).toBe('styles');
  });

  it('saves without prompting even though the edit made it dirty', async () => {
    const { wrapper, router } = await mountApp('/styles/edit?url=example.com');

    await wrapper.find('.url-input').setValue('renamed.com');
    await wrapper
      .findAll('.editor-footer button')
      .filter(w => w.text() === 'save')
      .at(0)
      .trigger('click');
    await flush();

    expect(router.currentRoute.name).toBe('styles');
    expect(wrapper.findComponent({ name: 'ConfirmDialog' }).exists()).toBe(
      false
    );
  });
});
