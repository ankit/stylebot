import { getSession } from './session';

// What the user did that a waiting `selection --wait` hears of.
export type UserEvent = 'mark' | 'unmark' | 'note';

// `stylebot selection --wait` calls, told when the user marks or writes.
const waiters = new Set<(event: UserEvent) => void>();

/**
 * Whether an agent is waiting for the user, which shows invites on tabs.
 */
export const hasWaiters = (): boolean => waiters.size > 0;

/**
 * Tells a function each time the user marks or unmarks an area or sends a
 * note, until the function it returns is called.
 */
export const listenForUser = (
  listener: (event: UserEvent) => void
): (() => void) => {
  waiters.add(listener);
  return () => waiters.delete(listener);
};

export const tellWaiters = (event: UserEvent): void =>
  waiters.forEach(waiter => waiter(event));

/**
 * Notes a mark the user made on the connected tab, unread until the agent
 * runs `stylebot selection`.
 */
export const onMark = (n: number): void => {
  const session = getSession();

  if (session) {
    session.unreadMarks.add(n);
    session.nextMark = Math.max(session.nextMark, n + 1);
  }

  tellWaiters('mark');
};

export const onUnmark = (n: number): void => {
  getSession()?.unreadMarks.delete(n);
  tellWaiters('unmark');
};

const count = (n: number, noun: string): string =>
  `${n} new ${noun}${n === 1 ? '' : 's'}`;

/**
 * The line the CLI prints after a command while notes or marks are unread.
 */
export const getUnreadNotice = (): string | undefined => {
  const session = getSession();
  const notes = session?.unreadNotes.length ?? 0;
  const marks = session?.unreadMarks.size ?? 0;

  if (!session || (!notes && !marks)) {
    return undefined;
  }

  const parts = [
    ...(notes ? [count(notes, 'note')] : []),
    ...(marks ? [count(marks, 'mark')] : []),
  ];

  return `${parts.join(' and ')} on tab ${
    session.tabId
  } (run stylebot selection)`;
};
