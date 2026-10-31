import type { CliMark, ElementFrame } from '@stylebot/types';

import { captureTab } from '../../capture-tab';
import { getSavedCss } from '../pointer';
import {
  SCROLL_PAINT_DELAY_MS,
  getViewport,
  renderCapture,
} from '../screenshot';
import { type Size, getElementRegion } from '../screenshot-region';
import type { CliCommands } from '../types';
import { refreshInvites } from './invites';
import { listenForMarks } from './marks';
import { type Session, getSession } from './session';
import { captureWithTerminal, sendToTerminal } from './terminal';

// After a mark, how long `selection --wait` waits for more before it answers.
const MARKS_SETTLE_MS = 2500;
const DEFAULT_WAIT_MS = 90_000;
const MAX_WAIT_MS = 10 * 60_000;

const NO_TAB =
  'No tab is in CLI mode. Connect one with: stylebot mode <tab>, or run stylebot selection --wait for the user to connect one';

type CroppedMark = CliMark & { dataUrl?: string };

export type Selection = {
  // The connected tab, or null when none is.
  tab: number | null;
  // --wait timed out with nothing new.
  waiting: boolean;
  marks: Array<CroppedMark>;
};

/**
 * Rejects a tab a command named that isn't the connected one.
 */
const checkTab = (session: Session, named: unknown): void => {
  if (named !== undefined && named !== '' && Number(named) !== session.tabId) {
    throw new Error(
      `CLI mode is on in tab ${session.tabId}, not tab ${named}. Use tab ${session.tabId}, or run: stylebot mode ${named}`
    );
  }
};

/**
 * Resolves to true a moment after the user stops marking, or false once the
 * timeout passes or the CLI goes away. While it waits, tabs show invites to
 * connect them, for when no tab is connected or the user wants another.
 */
const waitForMarks = (
  timeout: number,
  signal?: AbortSignal
): Promise<boolean> =>
  new Promise(resolve => {
    let pause: ReturnType<typeof setTimeout> | undefined;

    const finish = (arrived: boolean): void => {
      clearTimeout(pause);
      clearTimeout(timer);
      stop();
      signal?.removeEventListener('abort', onAbort);
      refreshInvites();
      resolve(arrived);
    };

    const stop = listenForMarks(() => {
      clearTimeout(pause);

      if (getSession()?.unreadMarks.size) {
        pause = setTimeout(() => finish(true), MARKS_SETTLE_MS);
      }
    });
    const timer = setTimeout(() => finish(false), timeout);
    const onAbort = (): void => finish(false);

    signal?.addEventListener('abort', onAbort);
    refreshInvites();
  });

/**
 * A screenshot of one mark's area, scrolled into view if it wasn't.
 */
const cropMark = async (
  tab: chrome.tabs.Tab,
  mark: CliMark,
  viewport: Size
): Promise<CroppedMark> => {
  const frame = await sendToTerminal<ElementFrame | null>(tab.id as number, {
    kind: 'frameMark',
    n: mark.n,
  });

  if (!frame) {
    return mark;
  }

  if (frame.scrolled && tab.active) {
    await new Promise(resolve => setTimeout(resolve, SCROLL_PAINT_DELAY_MS));
  }

  const region = getElementRegion(frame.rect, viewport).rect;
  const { dataUrl } = await renderCapture(
    await captureTab(tab),
    viewport,
    region,
    1
  );

  return { ...mark, dataUrl };
};

/**
 * A screenshot of each mark's area, with the marks hidden, and the page
 * scrolled back to where it was after.
 */
const cropMarks = async (
  tab: chrome.tabs.Tab,
  marks: Array<CliMark>
): Promise<Array<CroppedMark>> => {
  const tabId = tab.id as number;
  const viewport = await getViewport(tab);

  const { capture } = await captureWithTerminal(tabId, async () => {
    const cropped: Array<CroppedMark> = [];

    try {
      for (const mark of marks) {
        cropped.push(await cropMark(tab, mark, viewport));
      }
    } finally {
      await sendToTerminal(tabId, { kind: 'restoreScroll' }).catch(
        () => undefined
      );
    }

    return cropped;
  });

  return capture;
};

export const selectionCommands: CliCommands = {
  async selection({ tab, crop, wait, timeout }, signal): Promise<Selection> {
    const before = getSession();

    if (before) {
      checkTab(before, tab);
    } else if (!wait) {
      throw new Error(NO_TAB);
    }

    if (wait && !before?.unreadMarks.size) {
      const ms = Math.min(Number(timeout) || DEFAULT_WAIT_MS, MAX_WAIT_MS);
      const arrived = await waitForMarks(ms, signal);
      const after = getSession();

      if (!arrived || !after) {
        return { tab: after?.tabId ?? null, waiting: true, marks: [] };
      }
    }

    const session = getSession() as Session;
    const target = await chrome.tabs.get(session.tabId);
    const css = await getSavedCss(target.url);
    // A page still loading hasn't got its terminal back yet.
    const marks =
      (await sendToTerminal<Array<CliMark> | null>(session.tabId, {
        kind: 'selection',
        css,
      }).catch(() => null)) ?? [];

    session.unreadMarks.clear();

    return {
      tab: session.tabId,
      waiting: false,
      marks: crop ? await cropMarks(target, marks) : marks,
    };
  },
};
