import Vue from 'vue';
import Vuex, { Store } from 'vuex';

import { State } from 'editor/store';
import mockState from '../../store/__mocks__/state';

export {};

Vue.use(Vuex);

jest.mock('hotkeys-js', () => {
  const hotkeys = Object.assign(jest.fn(), { unbind: jest.fn() });
  return { __esModule: true, default: hotkeys };
});
jest.mock('../common');

type MockedHotkeys = jest.Mock & { unbind: jest.Mock };

describe('initCommandListener', () => {
  let hotkeys: MockedHotkeys;
  let commonModule: typeof import('../common');
  let initCommandListener: typeof import('../commands').default;
  let onChangedListener: (
    changes: Record<string, chrome.storage.StorageChange>,
    areaName: string
  ) => void;

  const buildStore = (commands: State['commands']): Store<State> =>
    new Store<State>({
      state: { ...mockState, commands },
      mutations: {
        setCommands(state, value: State['commands']) {
          state.commands = value;
        },
      },
    });

  beforeEach(() => {
    jest.resetModules();

    ({ default: hotkeys } = require('hotkeys-js'));
    commonModule = require('../common');

    global.chrome = {
      storage: {
        onChanged: {
          addListener: jest.fn(listener => {
            onChangedListener = listener;
          }),
        },
      },
    } as unknown as typeof chrome;

    ({ default: initCommandListener } = require('../commands'));
  });

  it('binds every configured, non-empty command on init', () => {
    const store = buildStore({
      readability: 'alt+shift+r',
      style: '',
      stylebot: 'alt+shift+m',
      grayscale: '',
    });

    initCommandListener(store);

    expect(hotkeys).toHaveBeenCalledWith('alt+shift+r', expect.any(Function));
    expect(hotkeys).toHaveBeenCalledWith('alt+shift+m', expect.any(Function));
    expect(hotkeys).toHaveBeenCalledTimes(2);
  });

  it('dispatches the matching handler when a bound combo fires', () => {
    const store = buildStore({
      readability: 'alt+shift+r',
      style: '',
      stylebot: '',
      grayscale: '',
    });

    initCommandListener(store);

    const [, handler] = hotkeys.mock.calls[0];
    handler();

    expect(commonModule.toggleReadability).toHaveBeenCalledWith(store);
  });

  it('re-binds hotkeys when chrome.storage reports a commands change', () => {
    const store = buildStore({
      readability: 'alt+shift+r',
      style: '',
      stylebot: '',
      grayscale: '',
    });
    initCommandListener(store);

    const newCommands = { readability: 'ctrl+shift+t', style: '', stylebot: '', grayscale: '' };
    onChangedListener({ commands: { newValue: newCommands } }, 'local');

    expect(hotkeys.unbind).toHaveBeenCalledWith('alt+shift+r');
    expect(hotkeys).toHaveBeenCalledWith('ctrl+shift+t', expect.any(Function));
    expect(store.state.commands).toEqual(newCommands);
  });

  it('ignores changes to other storage keys or areas', () => {
    const store = buildStore({
      readability: 'alt+shift+r',
      style: '',
      stylebot: '',
      grayscale: '',
    });
    initCommandListener(store);

    onChangedListener({ someOtherKey: { newValue: 1 } }, 'local');
    onChangedListener(
      { commands: { newValue: { readability: 'ctrl+shift+t', style: '', stylebot: '', grayscale: '' } } },
      'sync'
    );

    expect(store.state.commands?.readability).toBe('alt+shift+r');
    expect(hotkeys.unbind).not.toHaveBeenCalled();
  });
});
