/**
 * A style with no recorded edit time has to lose a merge against a copy that
 * carries a real timestamp on another machine. Backfilling `now` instead made
 * whichever machine started last win, discarding genuine edits made earlier
 * elsewhere.
 */
const UNKNOWN_MODIFIED_TIME = new Date(0).toISOString();

const StylesModifiedTimeUpdate = async (): Promise<void> => {
  return new Promise(resolve => {
    chrome.storage.local.get('styles', items => {
      if (!items['styles']) {
        resolve();
        return;
      }

      const styles = items['styles'];
      let changed = false;

      for (const url in styles) {
        if (!styles[url].modifiedTime) {
          styles[url].modifiedTime = UNKNOWN_MODIFIED_TIME;
          changed = true;
        }
      }

      if (!changed) {
        resolve();
        return;
      }

      // Deliberately not routed through setAll: a backfill is not a user edit
      // and must not bump styles-metadata, or it would sync as one.
      chrome.storage.local.set({ styles }, () => resolve());
    });
  });
};

export default StylesModifiedTimeUpdate;
