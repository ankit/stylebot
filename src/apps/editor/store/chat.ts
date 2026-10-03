import type { ActionContext, Module } from 'vuex';

import { applyEdits, revertEdits } from '@stylebot/chat';
import { getPageBridge } from '@stylebot/page-bridge';
import type {
  ChatAssistantTurn,
  ChatImage,
  ChatCssEdit,
  ChatCssPreviousValue,
  ChatErrorKey,
  ChatProviderId,
  ChatStatus,
  ChatStreamRequest,
  ChatTurn,
} from '@stylebot/types';

import type { State } from './';
import {
  chatConnect,
  chatRemoveKey,
  chatGetStatus,
  chatGetThread,
  chatSetModel,
  chatSetThread,
} from '../utils/chrome';
import { addFontImports, removeFontImports } from './chat-fonts';
import {
  getStreamRequest,
  getTurnId,
  getFailedMessage,
  getAssistantTurn,
  getStoppedTurn,
  getPlainTurns,
  getUserTurn,
} from './chat-reply';
import type { ChatMessage } from './chat-reply';
import { readChatImage } from '../utils/chat-image';
import { streamReply } from './chat-stream';
import type { ChatStreamHandlers } from './chat-stream';

/**
 * Where a reply is: reading the page before the model answers, writing
 * while it streams, applying once its edits arrive.
 */
export type ChatPhase = 'reading' | 'writing' | 'applying';

export type ChatError = { key: ChatErrorKey; detail?: string };

export type ChatState = {
  // Null until the background has answered.
  status: ChatStatus | null;
  // The site the thread belongs to.
  url: string;
  turns: Array<ChatTurn>;
  pending: { phase: ChatPhase; text: string } | null;
  error: ChatError | null;
  connecting: boolean;
  connectError: ChatError | null;
  // Attached in the composer, going out with the next message.
  draftImage: ChatImage | null;
  // The last file attached couldn't be read as an image.
  imageError: boolean;
};

type Context = ActionContext<ChatState, State>;

const buildRequest = async (
  { state, rootState }: Context,
  selector?: string
): Promise<ChatStreamRequest> => {
  const bridge = getPageBridge();
  // Either can fail (the page navigating away); the model can still work
  // from what it does get.
  const [outline, pageCss] = await Promise.all([
    bridge.getPageOutline().catch(() => ''),
    bridge.getPageCssContext(selector ?? '').catch(() => ''),
  ]);

  return getStreamRequest(
    {
      url: rootState.url,
      href: rootState.page.href,
      title: rootState.page.title,
      css: rootState.css,
      outline,
      pageCss,
      selector,
    },
    state.turns
  );
};

const setPhase = (
  { state, commit }: Context,
  phase: ChatPhase,
  delta = ''
): void => {
  commit('setPending', { phase, text: (state.pending?.text ?? '') + delta });
};

/**
 * The chat tab's store: the connection, the site's thread, and the reply
 * streaming in. Created per store, so nothing runs when the module loads.
 */
export const createChatModule = (): Module<ChatState, State> => {
  // Stops the reply streaming in, if there is one.
  let stopReply: (() => void) | null = null;

  const closeReply = () => {
    stopReply?.();
    stopReply = null;
  };

  const save = ({ state }: Context) => {
    if (state.url) {
      chatSetThread(state.url, getPlainTurns(state.turns));
    }
  };

  /**
   * Applies css the way any edit does, so it lands on the page, is saved,
   * and is one step on the editor's undo trail.
   */
  const applyCss = async (
    { dispatch, rootState }: Context,
    css: string,
    edits: Array<ChatCssEdit>,
    source: string
  ) => {
    await dispatch('applyCss', { css, source }, { root: true });

    const withImports = await addFontImports(rootState.css, edits);

    if (withImports !== rootState.css) {
      await dispatch(
        'applyCss',
        { css: withImports, record: false },
        { root: true }
      );
    }
  };

  /**
   * Keeps the pending reply in step with its stream, then adds it to the
   * thread as a turn, or shows why it failed.
   */
  const getReplyHandlers = (
    context: Context,
    model: string
  ): ChatStreamHandlers => {
    const { state, rootState, commit, dispatch } = context;
    const id = getTurnId();
    let edits: Array<ChatCssEdit> = [];
    let previous: Array<ChatCssPreviousValue> = [];
    let matches: Array<number | null> | undefined;

    return {
      onText: delta => setPhase(context, 'writing', delta),

      onEditsStart: () => setPhase(context, 'writing'),

      onEdits: replyEdits => {
        setPhase(context, 'applying');
        const result = applyEdits(rootState.css, replyEdits);
        edits = replyEdits;
        previous = result.previous;
        return applyCss(context, result.css, edits, `chat:${id}`).then(
          async () => {
            matches = await getPageBridge()
              .countMatches(edits.map(edit => edit.selector))
              .catch(() => undefined);
          }
        );
      },

      onDone: ({ usage, replay }) => {
        const turn = getAssistantTurn(
          { id, model, edits, previous, matches, usage, replay },
          state.pending?.text ?? ''
        );

        stopReply = null;
        commit('setPending', null);
        commit('addTurn', turn);
        save(context);
      },

      onError: error => {
        stopReply = null;
        commit('setPending', null);
        commit('setError', error);

        // The key is gone (removed from another tab); back to setup.
        if (error.key === 'chat_error_not_connected') {
          dispatch('load');
        }
      },
    };
  };

  return {
    namespaced: true,

    state: (): ChatState => ({
      status: null,
      url: '',
      turns: [],
      pending: null,
      error: null,
      connecting: false,
      connectError: null,
      draftImage: null,
      imageError: false,
    }),

    mutations: {
      setStatus(state: ChatState, status: ChatStatus): void {
        state.status = status;
      },

      setThread(
        state: ChatState,
        { url, turns }: { url: string; turns: Array<ChatTurn> }
      ): void {
        state.url = url;
        state.turns = turns;
      },

      addTurn(state: ChatState, turn: ChatTurn): void {
        state.turns = [...state.turns, turn];
      },

      updateTurn(
        state: ChatState,
        { id, patch }: { id: string; patch: Partial<ChatAssistantTurn> }
      ): void {
        state.turns = state.turns.map(turn =>
          turn.id === id && turn.role === 'assistant'
            ? { ...turn, ...patch }
            : turn
        );
      },

      setPending(state: ChatState, pending: ChatState['pending']): void {
        state.pending = pending;
      },

      setError(state: ChatState, error: ChatError | null): void {
        state.error = error;
      },

      setConnecting(state: ChatState, connecting: boolean): void {
        state.connecting = connecting;
      },

      setConnectError(state: ChatState, error: ChatError | null): void {
        state.connectError = error;
      },

      setDraftImage(state: ChatState, image: ChatImage | null): void {
        state.draftImage = image;
      },

      setImageError(state: ChatState, value: boolean): void {
        state.imageError = value;
      },
    },

    actions: {
      /**
       * Reads the connection and the thread for the site being edited;
       * again whenever that site changes.
       */
      async load({ commit, state, rootState }: Context): Promise<void> {
        const [status, turns] = await Promise.all([
          chatGetStatus(),
          state.url === rootState.url
            ? Promise.resolve(state.turns)
            : chatGetThread(rootState.url),
        ]);

        commit('setStatus', status);

        if (state.url !== rootState.url) {
          closeReply();
          commit('setPending', null);
          commit('setError', null);
          commit('setThread', { url: rootState.url, turns });
        }
      },

      /**
       * Checks the key with the provider and connects it; resolves to whether
       * it worked. Does nothing for an empty key or while one is checked.
       */
      async connect(
        { state, commit }: Context,
        { provider, key }: { provider: ChatProviderId; key: string }
      ): Promise<boolean> {
        if (!key.trim() || state.connecting) {
          return false;
        }

        commit('setConnecting', true);
        commit('setConnectError', null);

        try {
          const response = await chatConnect(provider, key);

          if (!response.ok) {
            commit('setConnectError', {
              key: response.errorKey,
              detail: response.errorDetail,
            });
            return false;
          }

          commit('setStatus', response.status);
          return true;
        } finally {
          commit('setConnecting', false);
        }
      },

      /**
       * Attaches an image file to the next message, replacing any already
       * attached.
       */
      async attachImage(
        { commit }: Context,
        { file, name }: { file: Blob; name?: string }
      ): Promise<void> {
        commit('setImageError', false);

        try {
          commit('setDraftImage', await readChatImage(file, name));
        } catch {
          commit('setImageError', true);
        }
      },

      removeImage({ commit }: Context): void {
        commit('setDraftImage', null);
        commit('setImageError', false);
      },

      clearConnectError({ commit }: Context): void {
        commit('setConnectError', null);
      },

      /**
       * Forgets a provider's key, stopping a reply coming from it.
       */
      async removeKey(
        { state, commit }: Context,
        provider: ChatProviderId
      ): Promise<void> {
        if (state.status?.provider === provider) {
          closeReply();
          commit('setPending', null);
        }

        commit('setStatus', await chatRemoveKey(provider));
      },

      async setModel(
        { commit }: Context,
        { provider, model }: { provider: ChatProviderId; model: string }
      ): Promise<void> {
        commit('setStatus', await chatSetModel(provider, model));
      },

      /**
       * Starts over on this site. Changes earlier replies made stay on the
       * page; only the conversation is cleared.
       */
      newChat(context: Context): void {
        const { state, commit } = context;

        closeReply();
        commit('setPending', null);
        commit('setError', null);
        commit('setThread', { url: state.url, turns: [] });
        save(context);
      },

      /**
       * Sends what's in the composer: the text, with the element picked and
       * the image attached right now.
       */
      sendDraft(
        { state, rootState, dispatch }: Context,
        text: string
      ): Promise<void> {
        return dispatch('send', {
          text,
          scope: rootState.activeSelector || undefined,
          image: state.draftImage ?? undefined,
        });
      },

      /**
       * Sends a message and streams the reply. Its picked element's page
       * CSS goes into the prompt.
       */
      async send(context: Context, message: ChatMessage): Promise<void> {
        const { state, commit } = context;

        if (!message.text.trim() || state.pending || !state.status?.connected) {
          return;
        }

        const model = state.status.model;

        commit('setError', null);
        commit('setDraftImage', null);
        commit('setImageError', false);
        commit('addTurn', getUserTurn(message));
        commit('setPending', { phase: 'reading', text: '' });
        save(context);

        const request = await buildRequest(context, message.scope);

        // Stopped while the page was being read.
        if (!state.pending) {
          return;
        }

        closeReply();
        stopReply = streamReply(request, getReplyHandlers(context, model));
      },

      /**
       * Stops the reply streaming in, keeping the text so far and applying
       * no CSS. Once its edits have arrived the reply is left to finish.
       */
      stop(context: Context): void {
        const { state, commit } = context;

        if (!state.pending || state.pending.phase === 'applying') {
          return;
        }

        const turn = getStoppedTurn(
          state.pending.text,
          state.status?.model ?? ''
        );

        closeReply();
        commit('setPending', null);
        commit('addTurn', turn);
        save(context);
      },

      /**
       * Undoes one reply's changes, putting back what its edits replaced, or
       * applies them again.
       */
      async toggleTurn(context: Context, id: string): Promise<void> {
        const { state, commit, rootState } = context;
        const turn = state.turns.find(
          (item): item is ChatAssistantTurn =>
            item.id === id && item.role === 'assistant'
        );

        if (!turn?.edits.length) {
          return;
        }

        if (turn.applied) {
          const reverted = revertEdits(rootState.css, turn.previous);
          const css = removeFontImports(reverted, turn.previous);

          commit('updateTurn', { id, patch: { applied: false } });
          await applyCss(context, css, [], `chat:${id}`);
        } else {
          const result = applyEdits(rootState.css, turn.edits);

          commit('updateTurn', {
            id,
            patch: { applied: true, previous: result.previous },
          });
          await applyCss(context, result.css, turn.edits, `chat:${id}`);
        }

        save(context);
      },

      /**
       * Sends the message whose reply failed again.
       */
      async retry({ state, commit, dispatch }: Context): Promise<void> {
        const failed = getFailedMessage(state.turns);
        commit('setError', null);

        if (!failed) {
          return;
        }

        commit('setThread', { url: state.url, turns: failed.turns });
        await dispatch('send', failed.message);
      },
    },
  };
};
