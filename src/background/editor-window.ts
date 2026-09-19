import { BackgroundPageUtils } from '@stylebot/styles';
import { EditorWindowBounds, StylebotLayout } from '@stylebot/types';

import { get as getOption } from './options';

const SESSION_KEY = 'editorWindows';

const DEFAULT_WIDTH = 420;
const DEFAULT_HEIGHT = 820;
const MIN_WIDTH = 340;
const MIN_HEIGHT = 400;

type Registry = Record<number, number>;

/**
 * tabId → windowId of the editor window driving that tab. Mirrored into
 * session storage so a restarted service worker still knows about windows
 * it opened; older Firefox has no session area and falls back to memory.
 */
let registry: Promise<Registry> | null = null;

const loadRegistry = (): Promise<Registry> => {
  if (!registry) {
    registry = (async () => {
      const items = await chrome.storage.session?.get(SESSION_KEY);
      return items?.[SESSION_KEY] ?? {};
    })();
  }

  return registry;
};

const saveRegistry = async (value: Registry): Promise<void> => {
  registry = Promise.resolve(value);
  await chrome.storage.session?.set({ [SESSION_KEY]: value });
};

const getWindowId = async (tabId: number): Promise<number | undefined> =>
  (await loadRegistry())[tabId];

const forget = async (
  predicate: (tabId: number, windowId: number) => boolean
) => {
  const current = await loadRegistry();
  const next: Registry = {};

  Object.entries(current).forEach(([tabId, windowId]) => {
    if (!predicate(Number(tabId), windowId)) {
      next[Number(tabId)] = windowId;
    }
  });

  await saveRegistry(next);
};

/**
 * A window that vanished between registry updates (e.g. closed while the
 * service worker was asleep) must not keep a stale id around.
 */
const getLiveWindowId = async (tabId: number): Promise<number | undefined> => {
  const windowId = await getWindowId(tabId);
  if (windowId === undefined) {
    return undefined;
  }

  try {
    await chrome.windows.get(windowId);
    return windowId;
  } catch {
    await forget(id => id === tabId);
    return undefined;
  }
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

/**
 * Restores the last-used bounds, else sits the window against the right
 * edge of the tab's own window like an undocked devtools panel.
 */
const getBounds = async (tab: chrome.tabs.Tab): Promise<EditorWindowBounds> => {
  const layout = (await getOption('layout')) as StylebotLayout | undefined;
  const saved = layout?.window;

  if (saved) {
    return {
      width: Math.max(saved.width, MIN_WIDTH),
      height: Math.max(saved.height, MIN_HEIGHT),
      left: Math.max(saved.left, 0),
      top: Math.max(saved.top, 0),
    };
  }

  const owner = await chrome.windows.get(tab.windowId);
  const ownerLeft = owner.left ?? 0;
  const ownerTop = owner.top ?? 0;
  const ownerWidth = owner.width ?? 1280;
  const ownerHeight = owner.height ?? 900;

  const height = clamp(ownerHeight - 120, MIN_HEIGHT, DEFAULT_HEIGHT);

  return {
    width: DEFAULT_WIDTH,
    height,
    left: Math.max(ownerLeft + ownerWidth - DEFAULT_WIDTH - 20, 0),
    top: Math.max(ownerTop + 80, 0),
  };
};

export const isOpen = async (tabId: number): Promise<boolean> =>
  (await getLiveWindowId(tabId)) !== undefined;

const opening = new Map<number, Promise<void>>();

/**
 * Opens (or focuses) the tab's editor window. Overlapping calls for the
 * same tab share one attempt, so a double click can't open two windows.
 */
export const open = (tabId: number): Promise<void> => {
  const inFlight = opening.get(tabId);
  if (inFlight) {
    return inFlight;
  }

  const attempt = openWindow(tabId).finally(() => {
    opening.delete(tabId);
  });
  opening.set(tabId, attempt);
  return attempt;
};

const openWindow = async (tabId: number): Promise<void> => {
  const existing = await getLiveWindowId(tabId);
  if (existing !== undefined) {
    await chrome.windows.update(existing, { focused: true });
    return;
  }

  const tab = await chrome.tabs.get(tabId);
  if (!tab.url || !BackgroundPageUtils.isValidUrl(tab.url)) {
    return;
  }

  const created = await chrome.windows.create({
    url: chrome.runtime.getURL(`editor-window/index.html?tabId=${tabId}`),
    type: 'popup',
    focused: true,
    ...(await getBounds(tab)),
  });

  if (created?.id !== undefined) {
    await saveRegistry({ ...(await loadRegistry()), [tabId]: created.id });
  }
};

export const close = async (tabId: number): Promise<void> => {
  const windowId = await getLiveWindowId(tabId);
  if (windowId === undefined) {
    return;
  }

  await forget(id => id === tabId);
  await chrome.windows.remove(windowId);
};

export const toggle = async (tabId: number): Promise<void> => {
  if (await isOpen(tabId)) {
    await close(tabId);
  } else {
    await open(tabId);
  }
};

/**
 * Drops the registry entry for a window that has just been closed.
 */
export const forgetWindow = (windowId: number): Promise<void> =>
  forget((_, id) => id === windowId);
