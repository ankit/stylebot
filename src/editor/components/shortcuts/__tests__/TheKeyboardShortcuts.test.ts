import { shallowMount } from '@vue/test-utils';

import { defaultEditorCommands } from '@stylebot/settings';
import TheKeyboardShortcuts from '../TheKeyboardShortcuts.vue';

interface TheKeyboardShortcutsInstance extends Vue {
  detachStylebotShortcuts(): void;
}

const buildMockStore = (visible: boolean) => ({
  state: {
    visible,
    help: false,
    inspecting: false,
    resizing: false,
    activeSelector: '',
    options: {
      mode: 'basic',
      layout: { dockLocation: 'right', adjustPageLayout: false },
    },
    editorCommands: defaultEditorCommands,
  },
  getters: { activeRule: undefined },
  commit: jest.fn(),
  dispatch: jest.fn(),
});

describe('TheKeyboardShortcuts.vue', () => {
  let wrapper: ReturnType<typeof shallowMount> | undefined;

  afterEach(() => {
    // the shortcut listener is attached directly on `document`, outside of
    // Vue's lifecycle, so it must be detached manually between tests.
    (wrapper?.vm as TheKeyboardShortcutsInstance | undefined)?.detachStylebotShortcuts();
    wrapper?.destroy();
    wrapper = undefined;
  });

  it('attaches the shortcut listener immediately when mounted with the editor already visible', () => {
    const store = buildMockStore(true);
    wrapper = shallowMount(TheKeyboardShortcuts, { mocks: { $store: store } });

    document.body.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
    );

    expect(store.dispatch).toHaveBeenCalledWith('closeStylebot');
  });

  it('does not attach the shortcut listener when mounted with the editor hidden', () => {
    const store = buildMockStore(false);
    wrapper = shallowMount(TheKeyboardShortcuts, { mocks: { $store: store } });

    document.body.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
    );

    expect(store.dispatch).not.toHaveBeenCalled();
  });
});
