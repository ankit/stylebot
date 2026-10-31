import Vue from 'vue';
import { t } from '@stylebot/i18n';
import { injectFontFaces } from '@stylebot/utils';
import type {
  CliModePageEvent,
  CliModeState,
  ViewportRect,
} from '@stylebot/types';

import CliMarks from './components/CliMarks.vue';
import CliModeTerminal from './components/CliModeTerminal.vue';
import { listenForKeys } from './keys';
import { createMarks, type Marks } from './marks';
import { createTerminalState, type TerminalState } from './state';
import { lastUndoableSave, threadSteps } from './thread';

// Inline and important on the host, so no page rule can move or hide it.
const HOST_CSS = `
  all: initial !important;
  position: fixed !important;
  inset: 0 !important;
  z-index: 2147483647 !important;
  display: block !important;
  pointer-events: none !important;
  direction: ltr !important;
  writing-mode: horizontal-tb !important;
`;

// Where the user last dragged the terminal, the same on every site.
const POSITION_KEY = 'cli-mode-terminal-position';
// The size the user last resized the open terminal to.
const SIZE_KEY = 'cli-mode-terminal-size';

export type Terminal = {
  state: TerminalState;
  // The connected tab's marks; a tab that only shows an invite has none.
  marks: Marks | null;
  // Where the terminal covers the viewport.
  locate: () => ViewportRect;
  remove: () => void;
};

let css: Promise<string> | null = null;

/**
 * The stylesheet, fetched once; a failed fetch is tried again next time.
 */
const getCss = (): Promise<string> => {
  if (!css) {
    css = fetch(chrome.runtime.getURL('cli-mode/index.css'))
      .then(response => response.text())
      .catch((e: unknown) => {
        css = null;
        throw e;
      });
  }

  return css;
};

const getPlacement = async (): Promise<
  Partial<Pick<TerminalState, 'position' | 'size'>>
> => {
  const stored = await chrome.storage.local.get([POSITION_KEY, SIZE_KEY]);
  return { position: stored[POSITION_KEY], size: stored[SIZE_KEY] };
};

const savePlacement = ({
  position,
  size,
}: Pick<TerminalState, 'position' | 'size'>): void => {
  chrome.storage.local
    .set({ [POSITION_KEY]: position, [SIZE_KEY]: size })
    .catch(() => undefined);
};

/**
 * Puts the terminal in a closed shadow root on the root element rather than the
 * body, where the page check and outline don't look, and hands what the
 * user does with it to `sendTerminalEvent`. On the connected tab, the user
 * marks areas and the keys work; elsewhere it only shows an invite.
 */
export const mountTerminal = async (
  sendTerminalEvent: (event: CliModePageEvent) => Promise<void>,
  { connected, initial }: { connected: boolean; initial?: CliModeState }
): Promise<Terminal> => {
  const host = document.createElement('stylebot-cli-mode');
  const root = host.attachShadow({ mode: 'closed' });
  const state = Object.assign(createTerminalState(), initial);

  host.style.cssText = HOST_CSS;
  host.lang = t('language_code');
  document.documentElement.append(host);
  injectFontFaces().catch(() => undefined);

  const [text, { position, size }] = await Promise.all([
    getCss(),
    getPlacement(),
  ]);
  const sheet = document.createElement('style');
  const marksEl = document.createElement('div');
  const el = document.createElement('div');

  if (position) {
    state.position = position;
  }

  if (size) {
    state.size = size;
  }

  sheet.textContent = text;
  root.append(sheet, marksEl, el);

  const marks = connected
    ? createMarks({
        host,
        state,
        onMark: ({ n, area }) => sendTerminalEvent({ type: 'mark', n, area }),
        onUnmark: n => sendTerminalEvent({ type: 'unmark', n }),
      })
    : null;

  const undoLastSave = (): void => {
    const save = lastUndoableSave(threadSteps(state.thread));

    if (save) {
      sendTerminalEvent({ type: 'undo', id: save.id });
    }
  };

  // Marks sent with a note whose screenshot isn't taken yet.
  const sending = new Set<number>();

  /**
   * Sends a note with the marks on the page, which stay there until the
   * background has read and captured them.
   */
  const sendNote = async (text: string): Promise<void> => {
    const numbers = state.marks.map(({ n }) => n).filter(n => !sending.has(n));

    numbers.forEach(n => sending.add(n));

    try {
      await sendTerminalEvent({ type: 'note', text, marks: numbers });
    } finally {
      numbers.forEach(n => {
        sending.delete(n);
        marks?.unmark(n);
      });
    }
  };

  let stopKeys = (): void => undefined;

  if (marks) {
    stopKeys = listenForKeys(
      state,
      {
        undo: undoLastSave,
        clearMarks: marks.clear,
        focusNote: async () => {
          state.expanded = true;
          await Vue.nextTick();
          (app.$refs.terminal as Vue & { focusNote: () => void }).focusNote();
        },
      },
      root
    );
  }

  const marksApp =
    marks &&
    new Vue({
      el: marksEl,
      render: h =>
        h(CliMarks, {
          props: { state },
          on: { unmark: marks.unmark },
        }),
    });

  const app = new Vue({
    el,
    render: h =>
      h(CliModeTerminal, {
        ref: 'terminal',
        props: { state },
        on: {
          note: sendNote,
          expand: (expanded: boolean) => {
            state.expanded = expanded;
          },
          undo: (id: number) => sendTerminalEvent({ type: 'undo', id }),
          highlight: (n: number | null) => {
            state.highlighted = n;
          },
          unmark: (n: number) => marks?.unmark(n),
          connect: () => sendTerminalEvent({ type: 'connect' }),
          dismiss: () => sendTerminalEvent({ type: 'dismiss' }),
          place: (placed: TerminalState['position']) => {
            state.position = placed;
          },
          resize: (size: TerminalState['size']) => {
            state.size = size;
          },
          move: () => savePlacement(state),
          close: () => sendTerminalEvent({ type: 'off' }),
        },
      }),
  });

  return {
    state,
    marks,
    locate: () => {
      const { left, top, width, height } = app.$el.getBoundingClientRect();

      return {
        x: Math.round(left),
        y: Math.round(top),
        width: Math.round(width),
        height: Math.round(height),
      };
    },
    remove: () => {
      stopKeys();
      marks?.destroy();
      marksApp?.$destroy();
      app.$destroy();
      host.remove();
    },
  };
};
