import Vue from 'vue';
import Vuex, { Store } from 'vuex';

import type { State } from 'editor/store';
import type { StylebotOptions } from '@stylebot/types';
import mockState from '../../store/__mocks__/state';
import initOptionsListener from '../options';

Vue.use(Vuex);

describe('initOptionsListener', () => {
  let onChangedListener: (
    changes: Record<string, chrome.storage.StorageChange>,
    areaName: string
  ) => void;

  const buildStore = (options: Partial<StylebotOptions>): Store<State> =>
    new Store<State>({
      state: { ...mockState, options: { ...mockState.options, ...options } },
      mutations: {
        setOptions(state, value: StylebotOptions) {
          state.options = value;
        },
      },
    });

  beforeEach(() => {
    global.chrome = {
      storage: {
        onChanged: {
          addListener: jest.fn(listener => {
            onChangedListener = listener;
          }),
        },
      },
    } as unknown as typeof chrome;
  });

  it('mirrors a mode picked in the editor window', () => {
    const store = buildStore({ mode: 'code' });
    initOptionsListener(store);

    onChangedListener(
      {
        options: {
          oldValue: { ...store.state.options, mode: 'code' },
          newValue: { ...store.state.options, mode: 'magic' },
        },
      },
      'local'
    );

    expect(store.state.options.mode).toBe('magic');
  });

  it('keeps a local mode override when another option changes', () => {
    const store = buildStore({ mode: 'magic' });
    initOptionsListener(store);

    const stored = { ...store.state.options, mode: 'code' as const };
    onChangedListener(
      {
        options: {
          oldValue: stored,
          newValue: {
            ...stored,
            layout: { ...stored.layout, dockLocation: 'left' },
          },
        },
      },
      'local'
    );

    expect(store.state.options.mode).toBe('magic');
    expect(store.state.options.layout.dockLocation).toBe('left');
  });
});
