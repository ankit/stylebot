import { shallowMount, Wrapper } from '@vue/test-utils';

import ColorPicker from '../ColorPicker.vue';

const buildMockStore = () => ({
  state: { activeSelector: 'h1' },
  getters: { activeRule: undefined },
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
});
