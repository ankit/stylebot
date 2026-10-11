import postcss from 'postcss';
import type { Wrapper } from '@vue/test-utils';
import { shallowMount } from '@vue/test-utils';

import ColorPicker from './ColorPicker.vue';

// The real page module pulls in the readability package, whose module-level
// Vue.mixin would override test-utils' mocked `t`.
jest.mock('@stylebot/page-bridge', () => ({
  getPageBridge: () => ({
    getPageColors: () => Promise.resolve({ text: [], surface: [], total: 0 }),
  }),
}));

const buildMockStore = () => ({
  state: { activeSelector: 'h1', computedStyles: {} },
  getters: { activeRule: null, setByOtherSelector: {} },
  commit: jest.fn(),
  dispatch: jest.fn(),
});

const pressEscape = () =>
  document.body.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
  );

describe('ColorPicker.vue', () => {
  let wrapper: Wrapper<Vue> | undefined;

  beforeEach(() => {
    jest.useFakeTimers();
    // jsdom has no ResizeObserver; the picker uses one to re-clamp the popover.
    (window as unknown as { ResizeObserver: unknown }).ResizeObserver = jest.fn(
      () => ({ observe: jest.fn(), disconnect: jest.fn() })
    );
  });

  afterEach(() => {
    wrapper?.destroy();
    wrapper = undefined;
    jest.useRealTimers();
  });

  const mountOpen = async () => {
    wrapper = shallowMount(ColorPicker, {
      propsData: { property: 'color' },
      mocks: { $store: buildMockStore() },
    });
    await wrapper.find('.color-swatch').trigger('click');
    return wrapper;
  };

  it('closes the popover on Escape before the editor sees the keypress', async () => {
    const wrapper = await mountOpen();
    expect(wrapper.find('.color-popover').exists()).toBe(true);

    // Stands in for the editor's own capture-phase document listener, which
    // would otherwise treat the same Escape as "close editor".
    const editorKeydown = jest.fn();
    document.addEventListener('keydown', editorKeydown, true);

    pressEscape();
    await wrapper.vm.$nextTick();

    expect(wrapper.find('.color-popover').exists()).toBe(false);
    expect(editorKeydown).not.toHaveBeenCalled();
    document.removeEventListener('keydown', editorKeydown, true);
  });

  it('stays open on Escape while a dropdown inside the popover is open', async () => {
    const wrapper = await mountOpen();

    const nestedMenu = document.createElement('div');
    nestedMenu.className = 'anchored-menu-panel';
    wrapper.find('.color-popover').element.appendChild(nestedMenu);

    pressEscape();
    await wrapper.vm.$nextTick();

    expect(wrapper.find('.color-popover').exists()).toBe(true);
  });

  it('stops listening for Escape once closed', async () => {
    const wrapper = await mountOpen();
    await wrapper.find('.color-swatch').trigger('click');
    expect(wrapper.find('.color-popover').exists()).toBe(false);

    const editorKeydown = jest.fn();
    document.addEventListener('keydown', editorKeydown, true);

    pressEscape();

    expect(editorKeydown).toHaveBeenCalledTimes(1);
    document.removeEventListener('keydown', editorKeydown, true);
  });

  describe('typing a value', () => {
    const mountField = (css = '') => {
      const store = buildMockStore();
      if (css) {
        store.getters.activeRule = postcss.parse(css).first as never;
      }
      wrapper = shallowMount(ColorPicker, {
        propsData: { property: 'color' },
        mocks: { $store: store },
      });
      return { input: wrapper.find('.color-hex'), store };
    };

    it('applies once typing pauses, not on every keystroke', async () => {
      const { input, store } = mountField();

      for (const value of ['t', 'tr', 'transparent']) {
        await input.setValue(value);
      }
      expect(store.dispatch).not.toHaveBeenCalled();
      expect((input.element as HTMLInputElement).value).toBe('transparent');

      jest.runAllTimers();

      expect(store.dispatch).toHaveBeenCalledTimes(1);
      expect(store.dispatch).toHaveBeenCalledWith('applyDeclaration', {
        property: 'color',
        value: 'transparent',
      });
    });

    it('applies straight away on Enter', async () => {
      const { input, store } = mountField();

      await input.setValue('red');
      await input.trigger('keydown.enter');

      expect(store.dispatch).toHaveBeenCalledWith('applyDeclaration', {
        property: 'color',
        value: 'red',
      });
    });

    it('widens to fit a long value', async () => {
      const { input } = mountField();

      await input.setValue('transparent');

      expect((input.element as HTMLInputElement).style.width).toBe(
        'calc(11ch + 8px)'
      );
    });

    it('keeps a half-typed value the store rejects', async () => {
      const { input } = mountField();

      await input.setValue('rgba(0, 0');
      jest.runAllTimers();
      await wrapper!.vm.$nextTick();

      expect((input.element as HTMLInputElement).value).toBe('rgba(0, 0');
    });

    it("doesn't narrow when a value is replaced", async () => {
      const { input } = mountField('h1 { color: transparent }');

      await input.setValue('#');

      expect((input.element as HTMLInputElement).style.width).toBe(
        'calc(11ch + 8px)'
      );
    });
  });
});
