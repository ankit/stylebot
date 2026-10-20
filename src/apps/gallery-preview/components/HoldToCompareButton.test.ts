import { mount, type Wrapper } from '@vue/test-utils';

import HoldToCompareButton from './HoldToCompareButton.vue';

type Listener = (event: Partial<KeyboardEvent>) => void;

// jsdom can't dispatch a trusted event, so the window's listeners are called
// directly with what they read of one.
const listeners: Record<string, Listener> = {};

const press = (
  type: 'keydown' | 'keyup',
  init: Partial<KeyboardEvent> = {}
) => {
  const event = {
    code: 'KeyC',
    isTrusted: true,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    target: document.body,
    preventDefault: jest.fn(),
    stopImmediatePropagation: jest.fn(),
    ...init,
  };

  listeners[type](event);

  return event;
};

describe('HoldToCompareButton.vue', () => {
  let wrapper: Wrapper<Vue>;

  const mountButton = (disabled = false) => {
    wrapper = mount(HoldToCompareButton, {
      propsData: { disabled },
      mocks: { t: (key: string) => key },
    });
  };

  beforeEach(() => {
    jest
      .spyOn(window, 'addEventListener')
      .mockImplementation((type, listener) => {
        listeners[type] = listener as Listener;
      });
  });

  afterEach(() => {
    wrapper.destroy();
    jest.restoreAllMocks();
  });

  it('compares while C is held, and keeps it from the page', () => {
    mountButton();

    const down = press('keydown');
    expect(down.preventDefault).toHaveBeenCalled();
    expect(down.stopImmediatePropagation).toHaveBeenCalled();
    expect(wrapper.emitted('change')).toEqual([[true]]);

    press('keyup');
    expect(wrapper.emitted('change')).toEqual([[true], [false]]);
  });

  it('leaves C alone with a modifier, in a field, or untrusted', () => {
    mountButton();

    press('keydown', { metaKey: true });
    press('keydown', { ctrlKey: true });
    press('keydown', { target: document.createElement('input') });
    press('keydown', { isTrusted: false });
    press('keydown', { code: 'KeyV' });

    expect(wrapper.emitted('change')).toBeUndefined();
  });

  it('ignores C while disabled', () => {
    mountButton(true);

    press('keydown');

    expect(wrapper.emitted('change')).toBeUndefined();
  });

  it('lets go when the window loses focus', () => {
    mountButton();

    press('keydown');
    listeners.blur({});

    expect(wrapper.emitted('change')).toEqual([[true], [false]]);
  });
});
