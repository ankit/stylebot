import { Store } from 'vuex';

import { State } from 'editor/store';
import mockState from '../../store/__mocks__/state';
import * as chromeUtils from '../../utils/chrome';
import { toggleStylebot, openStylebot } from '../common';

jest.mock('../../utils/chrome');
jest.mock('../../utils/init-editor', () => ({ initEditor: jest.fn() }));

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

const windowHostStore = () => {
  const dispatch = jest.fn().mockResolvedValue(undefined);

  const state: State = {
    ...mockState,
    options: {
      ...mockState.options,
      layout: { ...mockState.options.layout, dockLocation: 'window' },
    },
  };

  return { store: { state, dispatch } as unknown as Store<State>, dispatch };
};

describe('opening the editor in its own window', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('re-reads the stored style before the window can read it', async () => {
    const { store, dispatch } = windowHostStore();

    toggleStylebot(store);
    expect(chromeUtils.toggleEditorWindow).toBeCalledTimes(0);

    await flush();

    expect(dispatch).toBeCalledWith('refreshStyle');
    expect(chromeUtils.toggleEditorWindow).toBeCalledTimes(1);
  });

  it('does the same when the editor is opened rather than toggled', async () => {
    const { store, dispatch } = windowHostStore();

    openStylebot(store);
    await flush();

    expect(dispatch).toBeCalledWith('refreshStyle');
    expect(chromeUtils.openEditorWindow).toBeCalledTimes(1);
  });
});
