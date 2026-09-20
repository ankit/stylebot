import { shallowMount } from '@vue/test-utils';

import { defaultEditorCommands } from '@stylebot/settings';
import * as utils from '@stylebot/utils';
import TheKeyboardShortcuts from '../TheKeyboardShortcuts.vue';

type TheKeyboardShortcutsInstance = {
  detachStylebotShortcuts(): void;
} & Vue;

const buildMockStore = (visible: boolean, host = 'page') => ({
  state: {
    host,
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

  describe('undo and redo', () => {
    const press = (target: HTMLElement, init: KeyboardEventInit) =>
      target.dispatchEvent(
        new KeyboardEvent('keydown', { bubbles: true, composed: true, ...init })
      );

    let panel: HTMLElement;
    let pageInput: HTMLInputElement;
    let pageButton: HTMLButtonElement;

    beforeEach(() => {
      jest.spyOn(utils, 'isMac').mockReturnValue(true);

      panel = document.createElement('div');
      panel.id = 'stylebot';
      pageInput = document.createElement('input');
      pageButton = document.createElement('button');
      document.body.append(panel, pageInput, pageButton);
    });

    afterEach(() => {
      panel.remove();
      pageInput.remove();
      pageButton.remove();
    });

    it('undoes and redoes from inside the panel', () => {
      const store = buildMockStore(true);
      wrapper = shallowMount(TheKeyboardShortcuts, {
        mocks: { $store: store },
      });

      press(panel, { key: 'z', metaKey: true });
      expect(store.dispatch).toHaveBeenLastCalledWith('undo');

      press(panel, { key: 'z', metaKey: true, shiftKey: true });
      expect(store.dispatch).toHaveBeenLastCalledWith('redo');
    });

    it('undoes when nothing on the page has focus', () => {
      const store = buildMockStore(true);
      wrapper = shallowMount(TheKeyboardShortcuts, {
        mocks: { $store: store },
      });

      press(document.body, { key: 'z', metaKey: true });

      expect(store.dispatch).toHaveBeenCalledWith('undo');
    });

    it('leaves the key to a focused page element or text field', () => {
      const store = buildMockStore(true);
      wrapper = shallowMount(TheKeyboardShortcuts, {
        mocks: { $store: store },
      });

      press(pageButton, { key: 'z', metaKey: true });
      press(pageInput, { key: 'z', metaKey: true });

      expect(store.dispatch).not.toHaveBeenCalled();
    });

    it('still undoes while a field inside the panel has focus', () => {
      const panelField = document.createElement('input');
      panel.appendChild(panelField);

      const store = buildMockStore(true);
      wrapper = shallowMount(TheKeyboardShortcuts, {
        mocks: { $store: store },
      });

      press(panelField, { key: 'z', metaKey: true });

      expect(store.dispatch).toHaveBeenCalledWith('undo');
    });

    it('takes the key from anywhere in the window host', () => {
      const store = buildMockStore(true, 'window');
      wrapper = shallowMount(TheKeyboardShortcuts, {
        mocks: { $store: store },
      });

      press(pageButton, { key: 'z', metaKey: true });

      expect(store.dispatch).toHaveBeenCalledWith('undo');
    });

    it('reads Ctrl+Z and Ctrl+Y off macOS', () => {
      jest.spyOn(utils, 'isMac').mockReturnValue(false);
      const store = buildMockStore(true);
      wrapper = shallowMount(TheKeyboardShortcuts, {
        mocks: { $store: store },
      });

      press(panel, { key: 'z', ctrlKey: true });
      expect(store.dispatch).toHaveBeenLastCalledWith('undo');

      press(panel, { key: 'y', ctrlKey: true });
      expect(store.dispatch).toHaveBeenLastCalledWith('redo');
    });
  });
});
