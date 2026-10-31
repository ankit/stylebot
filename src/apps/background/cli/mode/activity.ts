import { getStylesForPage } from '@stylebot/saved-styles';
import type { CliTurnStep } from '@stylebot/types';

import { applyStylesToAllTabs, getAll, set } from '../../styles';
import { resolveTab } from '../targets';
import { describeCommand } from './command-lines';
import {
  type SavedVersion,
  type Session,
  getSession,
  isInCliMode,
  pushState,
  scheduleThinkingEnd,
  takeId,
} from './session';
import { onStyleEdited } from './watch';

// How long after its last command the agent counts as still running; a
// command after that starts a new turn in the thread.
export const ACTIVITY_MS = 8000;

/**
 * Adds a step to the thread: to the turn the agent is in the middle of, or
 * to a new one once it has paused.
 */
const addStep = (session: Session, step: CliTurnStep): void => {
  const last = session.thread[session.thread.length - 1];

  if (last?.kind === 'turn' && session.activity !== null) {
    last.steps.push(step);
  } else {
    session.thread.push({ kind: 'turn', id: takeId(), steps: [step] });
  }
};

/**
 * Whether the connected tab shows a page a style url applies to.
 */
const showsStyle = async (session: Session, url: string): Promise<boolean> => {
  const tab = await chrome.tabs.get(session.tabId).catch(() => undefined);

  return (
    !!tab?.url &&
    getStylesForPage(tab.url, await getAll()).defaultStyle?.url === url
  );
};

/**
 * Whether a command acts on the connected tab: names it, names a site its
 * style shows, or names nothing while it's the active tab.
 */
const actsOnSessionTab = async (
  session: Session,
  args: Record<string, unknown>
): Promise<boolean> => {
  const named = args.tab ?? args.target;

  if (typeof named === 'string' && named && !/^\d+$/.test(named)) {
    return showsStyle(session, named);
  }

  const tab = await resolveTab(named).catch(() => undefined);
  return isInCliMode(tab?.id);
};

/**
 * Shows in the terminal's thread a command the agent just sent, when it
 * acts on the connected tab, keeping its turn live until the agent pauses.
 */
export const noteCliActivity = async (
  command: string,
  args: Record<string, unknown>
): Promise<void> => {
  const session = getSession();
  const text = describeCommand(command, args);

  if (!session || text === undefined) {
    return;
  }

  const acts = await actsOnSessionTab(session, args);

  if (!acts) {
    return;
  }

  addStep(session, { kind: 'command', id: takeId(), text });
  session.agentSeen = true;
  session.agentLeft = false;
  session.activity = text;
  session.lastCommandAt = Date.now();
  scheduleThinkingEnd(session);
  clearTimeout(session.activityTimer);
  session.activityTimer = setTimeout(() => {
    session.activity = null;
    pushState();
  }, ACTIVITY_MS);
  pushState();
};

/**
 * Adds a save to the thread when the agent saves the style the connected
 * tab shows, with an undo that restores the version before.
 */
export const onCliSave = async (saved: SavedVersion): Promise<void> => {
  const session = getSession();

  if (!session) {
    return;
  }

  const shows = await showsStyle(session, saved.url);

  if (!shows) {
    return;
  }

  const id = takeId();

  session.saves.set(id, saved);
  addStep(session, { kind: 'save', id, url: saved.url, undone: false });
  pushState();
};

/**
 * Restores the version of a style from before a save the agent made.
 */
export const undoSave = async (session: Session, id: number): Promise<void> => {
  const saved = session.saves.get(id);

  if (!saved) {
    return;
  }

  session.saves.delete(id);
  await set(
    saved.url,
    saved.before,
    saved.readability,
    undefined,
    saved.profileId
  );
  await applyStylesToAllTabs();

  session.thread.forEach(entry =>
    (entry.kind === 'turn' ? entry.steps : []).forEach(step => {
      if (step.kind === 'save' && step.id === id) {
        step.undone = true;
      }
    })
  );
  pushState();
  await onStyleEdited(saved.url);
};
