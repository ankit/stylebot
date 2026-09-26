import { STYLES_KEY } from '@stylebot/styles';

/**
 * A style with no recorded edit time has to lose a merge against a copy that
 * carries a real timestamp on another machine. Backfilling `now` instead made
 * whichever machine started last win, discarding genuine edits made earlier
 * elsewhere.
 */
const UNKNOWN_MODIFIED_TIME = new Date(0).toISOString();

const StylesModifiedTimeUpdate = async (): Promise<void> => {
  const { [STYLES_KEY]: styles } = await chrome.storage.local.get(STYLES_KEY);

  if (!styles) {
    return;
  }

  let changed = false;

  for (const url in styles) {
    if (!styles[url].modifiedTime) {
      styles[url].modifiedTime = UNKNOWN_MODIFIED_TIME;
      changed = true;
    }
  }

  if (!changed) {
    return;
  }

  // Deliberately not routed through setAll: a backfill is not a user edit
  // and must not bump styles-metadata, or it would sync as one.
  await chrome.storage.local.set({ [STYLES_KEY]: styles });
};

export default StylesModifiedTimeUpdate;
