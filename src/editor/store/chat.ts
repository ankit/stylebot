import type { ActionContext, Module } from 'vuex';

import type { ChatErrorKey, ChatProviderId, ChatStatus } from '@stylebot/types';

import type { State } from './';
import { chatConnect, chatGetStatus } from '../utils/chrome';

export type ChatError = { key: ChatErrorKey; detail?: string };

export type ChatState = {
  // Null until the background has answered.
  status: ChatStatus | null;
  connecting: boolean;
  connectError: ChatError | null;
};

type Context = ActionContext<ChatState, State>;

/**
 * The chat tab's store: the connection to a provider. Created per store,
 * so nothing runs when the module loads.
 */
export const createChatModule = (): Module<ChatState, State> => ({
  namespaced: true,

  state: (): ChatState => ({
    status: null,
    connecting: false,
    connectError: null,
  }),

  mutations: {
    setStatus(state: ChatState, status: ChatStatus): void {
      state.status = status;
    },

    setConnecting(state: ChatState, connecting: boolean): void {
      state.connecting = connecting;
    },

    setConnectError(state: ChatState, error: ChatError | null): void {
      state.connectError = error;
    },
  },

  actions: {
    async load({ commit }: Context): Promise<void> {
      commit('setStatus', await chatGetStatus());
    },

    async connect(
      { commit }: Context,
      { provider, key }: { provider: ChatProviderId; key: string }
    ): Promise<void> {
      commit('setConnecting', true);
      commit('setConnectError', null);

      try {
        const response = await chatConnect(provider, key);

        if (response.ok) {
          commit('setStatus', response.status);
        } else {
          commit('setConnectError', {
            key: response.errorKey,
            detail: response.errorDetail,
          });
        }
      } finally {
        commit('setConnecting', false);
      }
    },

    clearConnectError({ commit }: Context): void {
      commit('setConnectError', null);
    },
  },
});
