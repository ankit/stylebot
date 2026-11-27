import { getSupportsEditorWindow } from './chrome';

let supported = true;

/**
 * Asks the background whether the browser can open the editor in a window,
 * for hasEditorWindow. The store calls this as it initializes.
 */
export const loadEditorWindowSupport = async (): Promise<void> => {
  supported = await getSupportsEditorWindow().catch(() => supported);
};

/**
 * Whether the editor can move into a window of its own. Content scripts
 * can't see chrome.windows, so the background answers.
 */
export const hasEditorWindow = (): boolean => supported;
