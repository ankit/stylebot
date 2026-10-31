// What `stylebot watch` prints, one a line.
export type WatchEvent =
  | { type: 'waiting' }
  | { type: 'attached'; tab: number; url: string }
  | { type: 'mark'; n: number; width: number; height: number }
  | { type: 'unmark'; n: number }
  | {
      type: 'note';
      tab: number;
      id: number;
      text: string;
      marks: Array<number>;
      image?: string;
    }
  | { type: 'navigated'; url: string }
  | { type: 'style-edited'; url: string }
  | { type: 'off' }
  | { type: 'closed' };

// An open `stylebot watch`.
export type Watcher = {
  emit: (event: WatchEvent) => void;
  // The tab `watch <tab>` connected, whose disconnect ends it.
  tab?: number;
  end: () => void;
};

const watchers = new Set<Watcher>();

/**
 * Whether a `stylebot watch` is open.
 */
export const isWatching = (): boolean => watchers.size > 0;

/**
 * Hands each event to a watch until the function it returns is called.
 */
export const addWatcher = (watcher: Watcher): (() => void) => {
  watchers.add(watcher);
  return () => watchers.delete(watcher);
};

/**
 * Hands an event to the open watches to print, answering whether one did.
 */
export const sendToWatchers = (event: WatchEvent): boolean => {
  watchers.forEach(watcher => watcher.emit(event));
  return watchers.size > 0;
};

/**
 * Ends each watch that connected a tab, telling it why first.
 */
export const endWatchersOf = (tabId: number, event: WatchEvent): void => {
  watchers.forEach(watcher => {
    if (watcher.tab === tabId) {
      watcher.emit(event);
      watcher.end();
    }
  });
};
