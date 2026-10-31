import { getStylesForPage } from '@stylebot/saved-styles';
import type { SetAllStyles, SetStyle, StyleMap } from '@stylebot/types';
import { isWebPageUrl } from '@stylebot/utils';

import { getAll } from '../../styles';
import { resolveTab } from '../targets';
import type { CliStreams } from '../types';
import { refreshInvites } from './invites';
import { connectTab, getSession, joinAgent } from './session';
import {
  type Watcher,
  addWatcher,
  isWatching,
  sendToWatchers,
} from './watchers';

// The editor saves after each pause in typing; a watch hears one line a burst.
export const STYLE_EDITED_MS = 1500;

let styleEditedTimer: ReturnType<typeof setTimeout> | undefined;

/**
 * Tells the watches the user changed the connected tab's style, once the
 * saves stop coming.
 */
const tellStyleEdited = (url: string): void => {
  clearTimeout(styleEditedTimer);
  styleEditedTimer = setTimeout(
    () => sendToWatchers({ type: 'style-edited', url }),
    STYLE_EDITED_MS
  );
};

/**
 * Tells the watches when a style saved outside the CLI is, or once saved
 * will be, the one the connected tab shows.
 */
export const onStyleEdited = async (url: string): Promise<void> => {
  const tabId = getSession()?.tabId;

  if (tabId === undefined || !isWatching()) {
    return;
  }

  const [tab, styles] = await Promise.all([
    chrome.tabs.get(tabId).catch(() => undefined),
    getAll(),
  ]);
  // A first save makes a style the background hasn't stored yet.
  const saved = { ...styles, [url]: styles[url] ?? { css: '' } };

  if (tab?.url && getStylesForPage(tab.url, saved).defaultStyle?.url === url) {
    tellStyleEdited(url);
  }
};

/**
 * Tells the watches when replacing every style, as Options does, changes
 * the css of the one the connected tab shows. Call it before the write.
 */
const onAllStylesSet = async (styles: StyleMap): Promise<void> => {
  const tabId = getSession()?.tabId;

  if (tabId === undefined) {
    return;
  }

  const [tab, before] = await Promise.all([
    chrome.tabs.get(tabId).catch(() => undefined),
    getAll(),
  ]);

  if (!tab?.url) {
    return;
  }

  const was = getStylesForPage(tab.url, before).defaultStyle;
  const is = getStylesForPage(tab.url, styles).defaultStyle;

  if (is && is.css !== was?.css) {
    tellStyleEdited(is.url);
  }
};

/**
 * Tells the watches about a save from the editor or Options. Leaves the
 * message to the background's own listener, and does nothing while no
 * watch is open.
 */
export const followStyleSave = (message: SetStyle | SetAllStyles): void => {
  if (!isWatching()) {
    return;
  }

  const told =
    message.name === 'SetStyle'
      ? onStyleEdited(message.url)
      : onAllStylesSet(message.styles);

  told.catch(() => undefined);
};

export const watchStreams: CliStreams = {
  async watch({ tab }, emit, signal) {
    let pinned: number | undefined;

    if (tab !== undefined && tab !== '') {
      const target = await resolveTab(tab);

      if (!target.url || !isWebPageUrl(target.url)) {
        throw new Error(
          `Stylebot can't run in tab ${target.id}: ${target.url}`
        );
      }

      pinned = target.id as number;
      await connectTab(pinned, { open: true, front: true });
    }

    await new Promise<void>(resolve => {
      const end = (): void => {
        signal.removeEventListener('abort', end);
        remove();
        leave();
        refreshInvites();
        resolve();
      };

      const watcher: Watcher = { emit, tab: pinned, end };
      const leave = joinAgent();
      const remove = addWatcher(watcher);
      const tabId = getSession()?.tabId;

      if (tabId === undefined) {
        emit({ type: 'waiting' });
      } else {
        chrome.tabs.get(tabId).then(
          tab => emit({ type: 'attached', tab: tabId, url: tab.url ?? '' }),
          () => undefined
        );
      }

      signal.addEventListener('abort', end);
      refreshInvites();

      if (signal.aborted) {
        end();
      }
    });

    return { tab: pinned ?? null };
  },
};
