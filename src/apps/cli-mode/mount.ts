import Vue from 'vue';
import { t } from '@stylebot/i18n';
import { injectFontFaces } from '@stylebot/utils';
import type { CliModePageEvent, ViewportRect } from '@stylebot/types';

import CliModeTerminal from './components/CliModeTerminal.vue';
import { listenForKeys } from './keys';
import { createTerminalState, type TerminalState } from './state';
import { lastUndoableSave } from './thread';

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

export type Terminal = {
  state: TerminalState;
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

const getPosition = async (): Promise<
  TerminalState['position'] | undefined
> => {
  const stored = await chrome.storage.local.get(POSITION_KEY);
  return stored[POSITION_KEY];
};

const savePosition = (position: TerminalState['position']): void => {
  chrome.storage.local.set({ [POSITION_KEY]: position }).catch(() => undefined);
};

/**
 * Puts the terminal in a closed shadow root on the root element rather than the
 * body, where the page check and outline don't look, and hands what the
 * user does with it to `sendTerminalEvent`.
 */
export const mountTerminal = async (
  sendTerminalEvent: (event: CliModePageEvent) => void
): Promise<Terminal> => {
  const host = document.createElement('stylebot-cli-mode');
  const root = host.attachShadow({ mode: 'closed' });
  const state = createTerminalState();

  host.style.cssText = HOST_CSS;
  host.lang = t('language_code');
  document.documentElement.append(host);
  injectFontFaces().catch(() => undefined);

  const [text, position] = await Promise.all([getCss(), getPosition()]);
  const sheet = document.createElement('style');
  const el = document.createElement('div');

  if (position) {
    state.position = position;
  }

  sheet.textContent = text;
  root.append(sheet, el);

  const stopKeys = listenForKeys(state, () => {
    const save = lastUndoableSave(state.thread.flatMap(turn => turn.steps));

    if (save) {
      sendTerminalEvent({ type: 'undo', id: save.id });
    }
  });

  const app = new Vue({
    el,
    render: h =>
      h(CliModeTerminal, {
        props: { state },
        on: {
          expand: (expanded: boolean) => {
            state.expanded = expanded;
          },
          undo: (id: number) => sendTerminalEvent({ type: 'undo', id }),
          place: (placed: TerminalState['position']) => {
            state.position = placed;
          },
          move: savePosition,
          close: () => sendTerminalEvent({ type: 'off' }),
        },
      }),
  });

  return {
    state,
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
      app.$destroy();
      host.remove();
    },
  };
};
