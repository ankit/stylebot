import { getSession } from './session';

// `stylebot selection --wait` calls, told when the user marks or unmarks.
const waiters = new Set<() => void>();

/**
 * Whether an agent is waiting for the user, which shows invites on tabs.
 */
export const hasWaiters = (): boolean => waiters.size > 0;

/**
 * Tells a function each time the user marks or unmarks an area, until the
 * function it returns is called.
 */
export const listenForMarks = (listener: () => void): (() => void) => {
  waiters.add(listener);
  return () => waiters.delete(listener);
};

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

  waiters.forEach(waiter => waiter());
};

export const onUnmark = (n: number): void => {
  getSession()?.unreadMarks.delete(n);
  waiters.forEach(waiter => waiter());
};

/**
 * The line the CLI prints after a command while marks are unread.
 */
export const getUnreadNotice = (): string | undefined => {
  const session = getSession();
  const count = session?.unreadMarks.size ?? 0;

  if (!session || !count) {
    return undefined;
  }

  return `${count} new mark${count === 1 ? '' : 's'} on tab ${
    session.tabId
  } (run stylebot selection)`;
};
