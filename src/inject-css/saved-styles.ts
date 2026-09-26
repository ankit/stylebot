import {
  COMPILED_STYLES_KEY,
  STYLES_METADATA_KEY,
  isCompiledStylesCurrent,
} from '@stylebot/styles';
import type {
  CompiledStyles,
  GetCompiledStyles,
  GetCompiledStylesResponse,
} from '@stylebot/types';

import { readCache } from './cache';
import { applyPageState, getPageState, savePageState } from './page-state';

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
 * Re-applies the saved styles as they are in storage now, e.g. after they
 * changed elsewhere. The cache records what was applied before, so a style
 * no longer enabled is removed even by a script that didn't inject it.
 */
export const reapplySavedStyles = async (): Promise<void> => {
  const previous = readCache();
  const state = getPageState(await getCompiledStyles());

  applyPageState(state, previous);
  savePageState(state);
};
