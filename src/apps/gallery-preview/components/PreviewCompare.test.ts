import { mount, type Wrapper } from '@vue/test-utils';

import PreviewCompare from './PreviewCompare.vue';

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

describe('PreviewCompare.vue', () => {
  let wrapper: Wrapper<Vue>;

  const mountButton = (disabled = false) => {
    wrapper = mount(PreviewCompare, {
      propsData: { disabled },
      mocks: { t: (key: string) => key },
      stubs: { SSegmentedControl: true },
      listeners: {
        change: (original: boolean) => wrapper.setProps({ original }),
      },
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

  it('switches when C is tapped, and keeps it from the page', () => {
    mountButton();
    jest.spyOn(Date, 'now').mockReturnValueOnce(1000).mockReturnValueOnce(1100);

    const down = press('keydown');
    expect(down.preventDefault).toHaveBeenCalled();
    expect(down.stopImmediatePropagation).toHaveBeenCalled();

    press('keyup');
    expect(wrapper.emitted('change')).toEqual([[true]]);
  });

  it('goes back when C is let go after a hold', () => {
    mountButton();
    jest.spyOn(Date, 'now').mockReturnValueOnce(1000).mockReturnValueOnce(1300);

    press('keydown');
    press('keydown');
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
