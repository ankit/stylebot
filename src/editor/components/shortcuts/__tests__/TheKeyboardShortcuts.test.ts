import { shallowMount } from '@vue/test-utils';

import { defaultEditorCommands } from '@stylebot/settings';
import TheKeyboardShortcuts from '../TheKeyboardShortcuts.vue';

type TheKeyboardShortcutsInstance = {
  detachStylebotShortcuts(): void;
} & Vue;

const buildMockStore = (visible: boolean) => ({
  state: {
    visible,
    help: false,
    inspecting: false,
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
    (
      wrapper?.vm as TheKeyboardShortcutsInstance | undefined
    )?.detachStylebotShortcuts();
    wrapper?.destroy();
    wrapper = undefined;
  });

  it('attaches the shortcut listener immediately when mounted with the editor already visible', () => {
    const store = buildMockStore(true);
    wrapper = shallowMount(TheKeyboardShortcuts, { mocks: { $store: store } });

    document.body.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
    );

    expect(store.dispatch).toHaveBeenCalledWith('escape');
  });

  it('does not attach the shortcut listener when mounted with the editor hidden', () => {
    const store = buildMockStore(false);
    wrapper = shallowMount(TheKeyboardShortcuts, { mocks: { $store: store } });

    document.body.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
    );

    expect(store.dispatch).not.toHaveBeenCalled();
  });

  describe('with focus in a field', () => {
    let field: HTMLInputElement;

    beforeEach(() => {
      field = document.createElement('input');
      document.body.appendChild(field);
      field.focus();
    });

    afterEach(() => {
      field.remove();
    });

    const press = (key: string) =>
      field.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));

    it('leaves single-key shortcuts and Escape to the field', () => {
      const store = buildMockStore(true);
      wrapper = shallowMount(TheKeyboardShortcuts, {
        mocks: { $store: store },
      });

      press('c');
      press('Escape');

      expect(store.dispatch).not.toHaveBeenCalled();
      expect(document.activeElement).toBe(field);
    });
  });
});
