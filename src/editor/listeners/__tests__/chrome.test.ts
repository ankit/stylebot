import type { Store } from 'vuex';

import type { State } from 'editor/store';
import type { TabMessage } from '@stylebot/types';
import mockState from '../../store/__mocks__/state';

jest.mock('../common');
jest.mock('../../utils/chrome');
jest.mock('@stylebot/readability');

import * as common from '../common';
import { createMessageHandler } from '../chrome';

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

const buildStore = (): Store<State> =>
  ({
    state: { ...mockState },
    commit: jest.fn(),
    dispatch: jest.fn(),
  } as unknown as Store<State>);

describe('createMessageHandler', () => {
  it('holds a message until the store is ready', async () => {
    let markReady = () => {};
    const ready = new Promise<void>(resolve => (markReady = resolve));
    const store = buildStore();
    const handle = createMessageHandler(store, ready);

    handle({ name: 'ToggleStylebot' } as TabMessage, jest.fn());
    await flushPromises();
    expect(common.toggleStylebot).not.toHaveBeenCalled();

    markReady();
    await flushPromises();
    expect(common.toggleStylebot).toHaveBeenCalledWith(store);
  });

  it('keeps the channel open only for GetIsStylebotOpen', () => {
    const handle = createMessageHandler(buildStore(), Promise.resolve());

    expect(handle({ name: 'GetIsStylebotOpen' } as TabMessage, jest.fn())).toBe(
      true
    );
    expect(handle({ name: 'ToggleStylebot' } as TabMessage, jest.fn())).toBe(
      false
    );
  });

  it('answers GetIsStylebotOpen from the panel state', async () => {
    const store = buildStore();
    store.state.visible = true;
    const sendResponse = jest.fn();

    createMessageHandler(store, Promise.resolve())(
      { name: 'GetIsStylebotOpen' } as TabMessage,
      sendResponse
    );
    await flushPromises();

    expect(sendResponse).toHaveBeenCalledWith(true);
  });
});
