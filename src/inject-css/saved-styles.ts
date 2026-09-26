import {
  COMPILED_STYLES_KEY,
  STYLES_METADATA_KEY,
  getStylesForPage,
  isCompiledStylesCurrent,
} from '@stylebot/styles';
import type {
  CompiledStyles,
  GetCompiledStyles,
  GetCompiledStylesResponse,
} from '@stylebot/types';

import { applyState } from './apply-state';
import type { CachedState } from './cache';
import { readCache, writeCache } from './cache';
import { pruneImportCache } from './import-cache';

/**
 * The compiled styles from storage, or from the background when the stored
 * copy is missing or was built from other styles, as on the first load after
 * an update.
 */
export const getCompiledStyles = async (): Promise<CompiledStyles> => {
  const items = await chrome.storage.local.get([
    COMPILED_STYLES_KEY,
    STYLES_METADATA_KEY,
  ]);
  const stored: CompiledStyles | undefined = items[COMPILED_STYLES_KEY];
  const revision: string = items[STYLES_METADATA_KEY]?.modifiedTime ?? '';

  if (stored && isCompiledStylesCurrent(stored, revision)) {
    return stored;
  }

  const message: GetCompiledStyles = { name: 'GetCompiledStyles' };
  return chrome.runtime.sendMessage<
    GetCompiledStyles,
    GetCompiledStylesResponse
  >(message);
};

/**
 * What this page should have applied: the compiled styles matching its url,
 * and whether its default style turns the reader on.
 */
export const getPageState = (compiled: CompiledStyles): CachedState => {
  const { styles, defaultStyle } = getStylesForPage(
    window.location.href,
    compiled.styles
  );

  return {
    styles: styles.map(({ url, css, importUrls, enabled }) => ({
      url,
      css,
      importUrls,
      enabled,
    })),
    readability: Boolean(defaultStyle?.readability),
  };
};

/**
 * Records the applied state for the next load's first paint, and drops the
 * cached responses of imports it no longer uses.
 */
export const savePageState = (state: CachedState): void => {
  writeCache(state);
  pruneImportCache(new Set(state.styles.flatMap(style => style.importUrls)));
};

/**
 * Re-applies the saved styles as they are in storage now, e.g. after they
 * changed elsewhere. The cache stands in for what was applied before, so a
 * style no longer enabled is removed even by a script that didn't inject it.
 */
export const reapplySavedStyles = async (): Promise<void> => {
  const previous = readCache();
  const state = getPageState(await getCompiledStyles());

  applyState(state, previous);
  savePageState(state);
};
