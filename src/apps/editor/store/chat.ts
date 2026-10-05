import type { ActionContext, Module } from 'vuex';

import {
  applyEdits,
  countCssLines,
  MAX_FIX_ROUNDS,
  needsFix,
} from '@stylebot/chat';
import { getPageBridge } from '@stylebot/page-bridge';
import type {
  ChatAssistantTurn,
  ChatImage,
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
import { revertReply } from './chat-fonts';
import {
  getStreamRequest,
  getTurnId,
  getFailedMessage,
  addUsage,
  getRoundsTurn,
  getStoppedTurn,
  getPlainTurns,
  getUserTurn,
} from './chat-reply';
import type { ChatMessage, ChatRoundResult } from './chat-reply';
import { readChatImage } from '../utils/chat-image';
import { streamReply } from './chat-stream';
import type { ChatStreamHandlers } from './chat-stream';
import { applyChatCss, createLiveEdits } from './chat-live-edits';
import type { LiveEdits } from './chat-live-edits';

/**
 * Where a reply is: reading the page before the model answers, writing
 * while it streams, applying once its edits start to arrive, and fixing
 * what the page check found after them.
 */
export type ChatPhase = 'reading' | 'writing' | 'applying' | 'fixing';

export type ChatError = { key: ChatErrorKey; detail?: string };

export type ChatState = {
  // Null until the background has answered.
  status: ChatStatus | null;
  // The site the thread belongs to.
  url: string;
  turns: Array<ChatTurn>;
  // lines counts the CSS the reply has applied so far.
  pending: { phase: ChatPhase; text: string; lines: number } | null;
  error: ChatError | null;
  connecting: boolean;
  connectError: ChatError | null;
  // Attached in the composer, going out with the next message.
  draftImage: ChatImage | null;
  // The last file attached couldn't be read as an image.
  imageError: boolean;
  // New chat is waiting on the clear confirmation.
  confirmingClear: boolean;
};

type Context = ActionContext<ChatState, State>;

/**
 * The reply in progress: the message's picked element, which a fix round
 * is about too, the apply_css calls made so far, and the one streaming in:
 * its text, its edits as they apply, and how to stop it.
 */
type Reply = {
  id: string;
  model: string;
  scope?: string;
  rounds: Array<ChatRoundResult>;
  text: string;
  live?: LiveEdits;
  stop?: () => void;
};

const buildRequest = async (
  { state, rootState }: Context,
  selector?: string,
  replyTurn?: ChatAssistantTurn
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
    replyTurn ? [...state.turns, replyTurn] : state.turns
  );
};

const setPhase = (
  { state, commit }: Context,
  phase: ChatPhase,
  delta = '',
  lines = state.pending?.lines ?? 0
): void => {
  commit('setPending', {
    phase,
    text: (state.pending?.text ?? '') + delta,
    lines,
  });
};

/**
 * The chat tab's store: the connection, the site's thread, and the reply
 * streaming in. Created per store, so nothing runs when the module loads.
 */
export const createChatModule = (): Module<ChatState, State> => {
  let reply: Reply | null = null;
  // Set while a reply streams, to keep its edits if the editor closes.
  let onPageHide: (() => void) | null = null;

  const unwatchPageHide = () => {
    if (onPageHide) {
      window.removeEventListener('pagehide', onPageHide);
      onPageHide = null;
    }
  };

  /**
   * Stops the reply streaming in, keeping (and saving) whatever edits its
   * call in progress has applied.
   */
  const closeReply = () => {
    reply?.stop?.();
    reply?.live?.close();
    reply = null;
    unwatchPageHide();
  };

  /**
   * Closes the reply and clears it from the chat.
   */
  const endReply = ({ commit }: Context) => {
    closeReply();
    commit('setPending', null);
  };

  const save = ({ state }: Context) => {
    if (state.url) {
      chatSetThread(state.url, getPlainTurns(state.turns));
    }
  };

  /**
   * Adds the reply's calls so far to the thread as one turn, marked
   * stopped when its first call was cut short.
   */
  const finishReply = (context: Context, current: Reply, stopped = false) => {
    const turn = getRoundsTurn(current.id, current.model, current.rounds);

    endReply(context);
    context.commit('addTurn', stopped ? { ...turn, stopped: true } : turn);
    save(context);
  };

  /**
   * Ends the reply streaming in early. The edits its call in progress has
   * applied stay, with the reply's earlier calls, as one reply to undo;
   * with none at all, the reply keeps only its text.
   */
  const keepStoppedReply = (context: Context) => {
    const { state, commit } = context;
    const current = reply;
    const live = current?.live;

    if (!state.pending) {
      return;
    }

    const { text } = state.pending;
    const first = !current?.rounds.length;

    closeReply();

    if (current && live?.edits.length) {
      current.rounds.push({
        text: current.text,
        edits: live.edits,
        previous: live.previous,
      });
    }

    if (current?.rounds.length) {
      finishReply(context, current, first);
      return;
    }

    commit('setPending', null);
    commit(
      'addTurn',
      getStoppedTurn(text, current?.model ?? state.status?.model ?? '')
    );
    save(context);
  };

  /**
   * Streams one apply_css call of the reply into the pending reply, then
   * either finishes the reply or, when the page check found problems,
   * streams another call to fix them.
   */
  const streamRound = (
    context: Context,
    current: Reply,
    request: ChatStreamRequest
  ) => {
    const { state, commit, dispatch } = context;
    const separator = state.pending?.text ? '\n\n' : '';
    const fixing = current.rounds.length > 0;
    const earlierLines = countCssLines(
      current.rounds.flatMap(round => round.edits)
    );
    const live = createLiveEdits(context, current.id, applied =>
      setPhase(context, 'applying', '', earlierLines + countCssLines(applied))
    );

    current.text = '';
    current.live = live;

    const handlers: ChatStreamHandlers = {
      onText: delta => {
        setPhase(
          context,
          live.edits.length ? 'applying' : 'writing',
          current.text ? delta : separator + delta
        );
        current.text += delta;
      },

      onEditsStart: () => setPhase(context, 'writing'),

      onEdit: edit => live.add(edit),

      onDone: async ({ usage, replay }) => {
        if (reply !== current) {
          return;
        }

        current.stop = undefined;
        const { matches, problems } = await live.finish();

        // Started over, or the editor left, while the edits applied.
        if (reply !== current) {
          return;
        }

        current.live = undefined;

        /* A fix that made text hard to read is taken back; the tokens it
         * spent still count toward the reply. */
        if (
          fixing &&
          problems?.some(problem => problem.type === 'unreadable-text')
        ) {
          await live.rollBack({ keepUndoStep: true });

          const last = current.rounds[current.rounds.length - 1];
          current.rounds[current.rounds.length - 1] = {
            ...last,
            usage: addUsage(last.usage, usage),
          };
          finishReply(context, current);
          return;
        }

        current.rounds.push({
          text: current.text,
          edits: live.edits,
          previous: live.previous,
          matches,
          problems,
          ...(usage ? { usage } : {}),
          ...(replay ? { replay } : {}),
        });

        if (
          !needsFix(current.rounds[current.rounds.length - 1]) ||
          current.rounds.length > MAX_FIX_ROUNDS
        ) {
          finishReply(context, current);
          return;
        }

        setPhase(context, 'fixing');

        const replyTurn = getRoundsTurn(
          current.id,
          current.model,
          current.rounds
        );
        const next = await buildRequest(context, current.scope, replyTurn);

        // Stopped while the page was being read.
        if (reply === current) {
          streamRound(context, current, next);
        }
      },

      onError: async error => {
        if (reply !== current) {
          return;
        }

        /* A failed call takes back what it applied: a fix leaves the reply as
         * its earlier calls made it; a first call leaves no reply, and nothing
         * on the page for sending again to build on. */
        current.stop = undefined;
        await live.rollBack({ keepUndoStep: fixing });

        if (reply !== current) {
          return;
        }

        current.live = undefined;

        if (fixing) {
          finishReply(context, current);
          return;
        }

        endReply(context);
        commit('setError', error);

        // The key is gone (removed from another tab); back to setup.
        if (error.key === 'chat_error_not_connected') {
          dispatch('load');
        }
      },
    };

    current.stop = streamReply(request, handlers);
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
      confirmingClear: false,
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

      setConfirmingClear(state: ChatState, value: boolean): void {
        state.confirmingClear = value;
      },
    },

    actions: {
      /**
       * Reads the connection and the thread for the site being edited;
       * again whenever that site changes.
       */
      async load(context: Context): Promise<void> {
        const { commit, state, rootState } = context;
        const [status, turns] = await Promise.all([
          chatGetStatus(),
          state.url === rootState.url
            ? Promise.resolve(state.turns)
            : chatGetThread(rootState.url),
        ]);

        commit('setStatus', status);

        if (state.url !== rootState.url) {
          endReply(context);
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
        context: Context,
        provider: ChatProviderId
      ): Promise<void> {
        const { state, commit } = context;

        if (state.status?.provider === provider) {
          endReply(context);
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

        endReply(context);
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
        commit('setPending', { phase: 'reading', text: '', lines: 0 });
        save(context);

        const request = await buildRequest(context, message.scope);

        // Stopped while the page was being read.
        if (!state.pending) {
          return;
        }

        closeReply();
        reply = {
          id: getTurnId(),
          model,
          scope: message.scope,
          rounds: [],
          text: '',
        };
        onPageHide = () => keepStoppedReply(context);
        window.addEventListener('pagehide', onPageHide);
        streamRound(context, reply, request);
      },

      /**
       * Stops the reply streaming in, keeping the text so far and the edits
       * already applied, as one reply to undo. Once a call's stream has
       * ended, it's left to finish applying and checking its edits.
       */
      stop(context: Context): void {
        // A call whose stream has ended (no stop left) is finishing.
        if (!reply?.live || reply.stop) {
          keepStoppedReply(context);
        }
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
          const css = revertReply(rootState.css, turn.previous);

          commit('updateTurn', { id, patch: { applied: false } });
          await applyChatCss(context, css, [], { source: `chat:${id}` });
        } else {
          const result = applyEdits(rootState.css, turn.edits);

          commit('updateTurn', {
            id,
            patch: { applied: true, previous: result.previous },
          });
          await applyChatCss(context, result.css, turn.edits, {
            source: `chat:${id}`,
          });
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
