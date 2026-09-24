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
    let section: HTMLElement;
    let field: HTMLInputElement;

    beforeEach(() => {
      section = document.createElement('div');
      section.setAttribute('data-focus-landing', '');
      section.tabIndex = -1;
      field = document.createElement('input');
      section.appendChild(field);
      document.body.appendChild(section);
      field.focus();
    });

    afterEach(() => {
      section.remove();
    });

    const press = (key: string) =>
      field.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));

    it('leaves single-key shortcuts to the field', () => {
      const store = buildMockStore(true);
      wrapper = shallowMount(TheKeyboardShortcuts, {
        mocks: { $store: store },
      });

      press('c');

      expect(store.dispatch).not.toHaveBeenCalled();
    });

    it('moves focus to the surrounding section on Escape instead of closing', () => {
      const store = buildMockStore(true);
      wrapper = shallowMount(TheKeyboardShortcuts, {
        mocks: { $store: store },
      });

      press('Escape');

      expect(document.activeElement).toBe(section);
      expect(store.dispatch).not.toHaveBeenCalled();
    });

    it('moves focus to the control heading the field on Escape', () => {
      const store = buildMockStore(true);
      wrapper = shallowMount(TheKeyboardShortcuts, {
        mocks: { $store: store },
      });
      const card = document.createElement('div');
      const header = document.createElement('button');
      header.setAttribute('data-focus-landing', '');
      card.append(header, field);
      section.appendChild(card);
      field.focus();

      press('Escape');

      expect(document.activeElement).toBe(header);
    });

    it('leaves a field outside the editor alone on Escape', () => {
      const store = buildMockStore(true);
      wrapper = shallowMount(TheKeyboardShortcuts, {
        mocks: { $store: store },
      });
      section.remove();
      document.body.appendChild(field);
      field.focus();

      press('Escape');

      expect(document.activeElement).toBe(field);
      expect(store.dispatch).not.toHaveBeenCalled();
      field.remove();
    });
  });
});
