import { getGoogleDriveSyncEnabled } from '../sync/google-drive/sync-metadata';

const PERIODIC_ALARM = 'google-drive-sync';
const AFTER_EDIT_ALARM = 'google-drive-sync-after-edit';

export const SYNC_PERIOD_MINUTES = 30;

// Long enough for a burst of keystrokes in the code editor to settle into one
// upload, and the shortest delay chrome.alarms honours for an installed
// extension (Chrome 120+ clamps anything under 30s).
const AFTER_EDIT_DELAY_MS = 30 * 1000;

export const isSyncAlarm = (name: string): boolean =>
  name === PERIODIC_ALARM || name === AFTER_EDIT_ALARM;

/**
 * Keeps the periodic alarm in step with the enabled flag. Runs on every
 * service worker start, which MV3 does often — so an existing alarm is left
 * alone: creating one with the same name replaces it and restarts its
 * countdown, and a worker that woke more often than every 30 minutes would
 * never let the periodic sync fire.
 */
export const updatePeriodicSync = async (): Promise<void> => {
  if (await getGoogleDriveSyncEnabled()) {
    if (!(await chrome.alarms.get(PERIODIC_ALARM))) {
      chrome.alarms.create(PERIODIC_ALARM, {
        periodInMinutes: SYNC_PERIOD_MINUTES,
      });
    }
    return;
  }

  chrome.alarms.clear(PERIODIC_ALARM);
  chrome.alarms.clear(AFTER_EDIT_ALARM);
};

/**
 * Debounced sync after a local edit: each call pushes the alarm out again, so
 * it fires once the edits stop.
 */
export const scheduleSyncAfterEdit = async (): Promise<void> => {
  if (!(await getGoogleDriveSyncEnabled())) {
    return;
  }

  chrome.alarms.create(AFTER_EDIT_ALARM, {
    when: Date.now() + AFTER_EDIT_DELAY_MS,
  });
};
