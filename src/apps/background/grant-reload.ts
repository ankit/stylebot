import { openOptionsTab } from './options-tab';
import { findOpenEditors, restoreOpenTabs } from './restore-tabs';
import type { OpenEditors } from './restore-tabs';

type GrantReload = {
  editors: OpenEditors;
  optionsRoute?: string;
};

/**
 * Reloads Stylebot for a permission granted at runtime, which some APIs only
 * take up in a fresh start. Remembers under `key` where the editor is open,
 * plus `open`, and the Options route to show, to put them back after.
 */
export const reloadForGrant = async (
  key: string,
  { open = {}, optionsRoute }: { open?: OpenEditors; optionsRoute?: string }
): Promise<void> => {
  const editors = { ...(await findOpenEditors()), ...open };
  const reload: GrantReload = { editors, optionsRoute };

  await chrome.storage.local.set({ [key]: reload });
  chrome.runtime.reload();
};

/**
 * Puts back what a reload for a grant under `key` remembered, and reports
 * whether this start followed one.
 */
export const resumeAfterGrantReload = async (key: string): Promise<boolean> => {
  const items = await chrome.storage.local.get(key);
  const reload: GrantReload | undefined = items[key];

  if (!reload) {
    return false;
  }

  await chrome.storage.local.remove(key);
  await restoreOpenTabs(reload.editors);

  if (reload.optionsRoute !== undefined) {
    await openOptionsTab(reload.optionsRoute);
  }

  return true;
};
