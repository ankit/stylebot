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
import { listenForUser } from './marks';
import { type NoteRead, type Session, checkTab, getSession } from './session';
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
  // Notes the user sent since the agent last looked, oldest first.
  notes: Array<NoteRead>;
  // Marks not sent with a note yet.
  marks: Array<CroppedMark>;
};

/**
 * Resolves to true once a note comes or the user stops marking, false on
 * timeout or abort. Tabs show invites meanwhile.
 */
const waitForUser = (timeout: number, signal?: AbortSignal): Promise<boolean> =>
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

    const stop = listenForUser(event => {
      clearTimeout(pause);

      if (event === 'note') {
        finish(true);
      } else if (getSession()?.unreadMarks.size) {
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

    if (wait && !before?.unreadMarks.size && !before?.unreadNotes.length) {
      const ms = Math.min(Number(timeout) || DEFAULT_WAIT_MS, MAX_WAIT_MS);
      const arrived = await waitForUser(ms, signal);
      const after = getSession();

      if (!arrived || !after) {
        return {
          tab: after?.tabId ?? null,
          waiting: true,
          notes: [],
          marks: [],
        };
      }
    }

    const session = getSession() as Session;
    const target = await chrome.tabs.get(session.tabId);
    const css = await getSavedCss(target.url);
    // A page still loading hasn't got its terminal back yet.
    const shown =
      (await sendToTerminal<Array<CliMark> | null>(session.tabId, {
        kind: 'selection',
        css,
      }).catch(() => null)) ?? [];
    // A note's marks stay on the page until it's captured, and go with it.
    const noted = new Set(
      session.thread.flatMap(entry =>
        entry.kind === 'note' ? entry.marks : []
      )
    );
    const marks = shown.filter(mark => !noted.has(mark.n));
    const notes = session.unreadNotes;

    session.unreadMarks.clear();
    session.unreadNotes = [];

    return {
      tab: session.tabId,
      waiting: false,
      notes,
      marks: crop ? await cropMarks(target, marks) : marks,
    };
  },
};
