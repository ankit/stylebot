import type { CliMark, ViewportRect } from '@stylebot/types';

import { captureTab } from '../../capture-tab';
import { getSavedCss } from '../pointer';
import { getViewport, renderCapture } from '../screenshot';
import type { Size } from '../screenshot-region';
import type { CliCommands } from '../types';
import { tellWaiters } from './marks';
import {
  type Session,
  checkTab,
  getSession,
  isAgentAround,
  pushState,
  scheduleThinkingEnd,
  takeId,
} from './session';
import { sendToTerminal } from './terminal';
import { sendToWatchers } from './watchers';

// Room around the marks in a note's screenshot, which holds their badges.
const NOTE_IMAGE_PADDING = 24;

const NO_TAB = 'No tab is in CLI mode. Connect one with: stylebot mode <tab>';

/**
 * The part of the viewport around the marks it shows, padded and kept
 * inside it; undefined when none shows.
 */
export const getNoteRegion = (
  rects: Array<ViewportRect>,
  viewport: Size
): ViewportRect | undefined => {
  const shown = rects.filter(
    rect =>
      rect.x < viewport.width &&
      rect.y < viewport.height &&
      rect.x + rect.width > 0 &&
      rect.y + rect.height > 0
  );

  if (!shown.length) {
    return undefined;
  }

  const left = Math.max(
    0,
    Math.min(...shown.map(rect => rect.x)) - NOTE_IMAGE_PADDING
  );
  const top = Math.max(
    0,
    Math.min(...shown.map(rect => rect.y)) - NOTE_IMAGE_PADDING
  );
  const right = Math.min(
    viewport.width,
    Math.max(...shown.map(rect => rect.x + rect.width)) + NOTE_IMAGE_PADDING
  );
  const bottom = Math.min(
    viewport.height,
    Math.max(...shown.map(rect => rect.y + rect.height)) + NOTE_IMAGE_PADDING
  );

  return { x: left, y: top, width: right - left, height: bottom - top };
};

/**
 * A PNG of the area around a note's marks as the page shows them, badges
 * and all; undefined when none is in view.
 */
const captureNoteArea = async (
  tab: chrome.tabs.Tab,
  marks: Array<CliMark>
): Promise<string | undefined> => {
  const viewport = await getViewport(tab);
  const region = getNoteRegion(
    marks.map(({ rect }) => rect),
    viewport
  );

  if (!region) {
    return undefined;
  }

  const { dataUrl } = await renderCapture(
    await captureTab(tab),
    viewport,
    region,
    1
  );

  return dataUrl;
};

/**
 * Adds a note the user sent to the thread, and keeps it for `selection`
 * with its marks as `selection` reports them and a screenshot of them. The
 * page keeps the marks until this resolves.
 */
export const onNote = async (
  session: Session,
  text: string,
  numbers: Array<number>
): Promise<void> => {
  const tab = await chrome.tabs.get(session.tabId);
  const css = await getSavedCss(tab.url);
  const described =
    (await sendToTerminal<Array<CliMark> | null>(session.tabId, {
      kind: 'selection',
      css,
    }).catch(() => null)) ?? [];
  const marks = described.filter(mark => numbers.includes(mark.n));
  const id = takeId();

  session.thread.push({ kind: 'note', id, text, marks: numbers });
  // The note carries its marks, so they're no longer new on their own.
  numbers.forEach(n => session.unreadMarks.delete(n));
  session.awaitingReply = true;

  // An agent watching or waiting for the user gets to work on it right away.
  if (isAgentAround()) {
    session.lastCommandAt = Date.now();
  }

  scheduleThinkingEnd(session);
  pushState();

  const image = await captureNoteArea(tab, marks).catch(() => undefined);

  session.unreadNotes.push({ id, text, marks, image });
  tellWaiters('note');

  // What a watch prints counts as read.
  const printed = sendToWatchers({
    type: 'note',
    tab: session.tabId,
    id,
    text,
    marks: numbers,
    image,
  });

  if (printed) {
    session.unreadNotes = session.unreadNotes.filter(note => note.id !== id);
  }
};

export const noteCommands: CliCommands = {
  async say({ tab, message }) {
    const session = getSession();

    if (!session) {
      throw new Error(NO_TAB);
    }

    checkTab(session, tab);

    const text = String(message ?? '').trim();

    if (!text) {
      throw new Error('say needs a message');
    }

    session.thread.push({ kind: 'reply', id: takeId(), text });
    session.agentSeen = true;
    session.agentLeft = false;
    session.awaitingReply = false;
    clearTimeout(session.thinkingTimer);
    pushState();

    return { tab: session.tabId };
  },
};
