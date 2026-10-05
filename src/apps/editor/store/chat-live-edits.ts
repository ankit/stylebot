import type { ActionContext } from 'vuex';

import { applyEdits } from '@stylebot/chat';
import { getPageBridge } from '@stylebot/page-bridge';
import type {
  ChatCssEdit,
  ChatCssPreviousValue,
  ChatStyleProblem,
} from '@stylebot/types';

import type { State } from './';
import type { ChatState } from './chat';
import { addFontImports, revertReply } from './chat-fonts';
import { discardChange } from './undo-stack';

type Context = ActionContext<ChatState, State>;

/**
 * Applies a reply's css the way any edit does, so it lands on the page and
 * goes on the editor's undo trail, then adds imports for the fonts its
 * edits name.
 */
export const applyChatCss = async (
  { dispatch, rootState }: Context,
  css: string,
  edits: Array<ChatCssEdit>,
  options: { source: string; group?: boolean; save?: boolean }
): Promise<void> => {
  await dispatch('applyCss', { css, ...options }, { root: true });

  const withImports = await addFontImports(rootState.css, edits);

  if (withImports !== rootState.css) {
    await dispatch(
      'applyCss',
      { css: withImports, record: false, save: options.save },
      { root: true }
    );
  }
};

/**
 * The edits with partly hashed classes in their selectors swapped for
 * stable matchers, or as written when the page can't be asked.
 */
const withStableSelectors = async (
  edits: Array<ChatCssEdit>
): Promise<Array<ChatCssEdit>> => {
  const selectors = await getPageBridge()
    .getStableSelectors(edits.map(edit => edit.selector))
    .catch(() => null);

  return edits.map((edit, i) => ({
    ...edit,
    selector: selectors?.[i] ?? edit.selector,
  }));
};

const declarationKey = ({ selector, property }: ChatCssPreviousValue) =>
  `${selector}\n${property}`;

export type LiveEdits = ReturnType<typeof createLiveEdits>;

/**
 * One apply_css call's edits, applied to the page as they stream in, in
 * batches of whatever has arrived since the last one landed. Every call of
 * a reply shares one undo step, and is saved once, when the call ends or
 * is cut short. previous holds what the first edit of each declaration
 * replaced, so the call can be undone.
 */
export const createLiveEdits = (
  context: Context,
  id: string,
  onApplied: (edits: Array<ChatCssEdit>) => void
) => {
  const { rootState, dispatch, commit } = context;
  const bridge = getPageBridge();
  const source = `chat:${id}`;
  const edits: Array<ChatCssEdit> = [];
  const previous: Array<ChatCssPreviousValue> = [];
  const seen = new Set<string>();
  let waiting: Array<ChatCssEdit> = [];
  let queue: Promise<void> = Promise.resolve();
  // The page check, started with the first batch; false when the page can't
  // be checked, which still gets the edits.
  let checking: Promise<boolean> | null = null;
  // Once closed, edits still to come are dropped.
  let closed = false;

  const save = () => {
    if (edits.length) {
      dispatch(
        'applyCss',
        { css: rootState.css, record: false },
        { root: true }
      );
    }
  };

  /**
   * Applies the edits that arrived since the last batch. The stylesheet and
   * previous change together, after the waits before them, so a call cut
   * short keeps exactly what's applied.
   */
  const applyWaiting = async () => {
    const batch = waiting;
    waiting = [];

    if (!batch.length || closed) {
      return;
    }

    const stable = await withStableSelectors(batch);

    if (!checking) {
      checking = bridge.startStyleCheck(stable).then(
        () => true,
        () => false
      );
    } else if (await checking) {
      await bridge.extendStyleCheck(stable).catch(() => undefined);
    }

    await checking;

    if (closed) {
      return;
    }

    const result = applyEdits(rootState.css, stable);

    result.previous.forEach(value => {
      if (!seen.has(declarationKey(value))) {
        seen.add(declarationKey(value));
        previous.push(value);
      }
    });
    edits.push(...stable);

    await applyChatCss(context, result.css, stable, {
      source,
      group: true,
      save: false,
    });
    onApplied(edits);

    // Closed while its fonts loaded; save what landed since.
    if (closed) {
      save();
    }
  };

  return {
    edits,
    previous,

    /**
     * Queues an edit, applied with any others waiting once those before
     * have landed.
     */
    add(edit: ChatCssEdit): void {
      if (!closed) {
        waiting.push(edit);
        queue = queue.then(applyWaiting).catch(() => undefined);
      }
    },

    /**
     * Once the stream has ended: waits for the queued edits, saves, then
     * counts what each selector matched and checks the page for what the
     * edits made worse.
     */
    async finish(): Promise<{
      matches?: Array<number | null>;
      problems?: Array<ChatStyleProblem>;
    }> {
      await queue;
      save();

      if (!edits.length) {
        return {};
      }

      const [matches, problems] = await Promise.all([
        bridge
          .countMatches(edits.map(edit => edit.selector))
          .catch(() => undefined),
        (await checking)
          ? bridge.checkStyle().catch(() => undefined)
          : undefined,
      ]);

      return { matches, problems };
    },

    /**
     * Keeps the edits applied so far and saves them right away, dropping
     * any still to come; for a call stopped or left mid-stream.
     */
    close(): void {
      if (!closed) {
        closed = true;
        save();
      }
    },

    /**
     * Takes back every edit this call applied. A reply's first call also
     * takes back its undo step, since the reply leaves no turn to undo; a
     * later call leaves it to the calls before.
     */
    async rollBack({ keepUndoStep }: { keepUndoStep: boolean }): Promise<void> {
      closed = true;
      await queue;

      if (!edits.length) {
        return;
      }

      dispatch(
        'applyCss',
        { css: revertReply(rootState.css, previous), record: false },
        { root: true }
      );

      if (!keepUndoStep) {
        commit('setUndoStack', discardChange(rootState.undoStack, source), {
          root: true,
        });
      }
    },
  };
};
