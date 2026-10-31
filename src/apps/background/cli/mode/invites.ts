import { isWebPageUrl } from '@stylebot/utils';

import { hasWaiters } from './marks';
import { getSession } from './session';
import { isWatching } from './watchers';
import { sendToTerminal } from './terminal';

// Tabs showing an invite, to update or take it away from.
const invited = new Set<number>();

/**
 * The host of the connected tab's page, which invites name.
 */
const getConnectedHost = async (): Promise<string | null> => {
  const session = getSession();
  const tab = session
    ? await chrome.tabs.get(session.tabId).catch(() => undefined)
    : undefined;

  return tab?.url ? new URL(tab.url).hostname : null;
};

const takeAwayInvites = async (): Promise<void> => {
  const connectedTab = getSession()?.tabId;
  // An invited tab the user connected shows the terminal now.
  const tabs = Array.from(invited).filter(tabId => tabId !== connectedTab);

  invited.clear();
  await Promise.all(
    tabs.map(tabId =>
      sendToTerminal(tabId, { kind: 'off' }).catch(() => undefined)
    )
  );
};

const showInvites = async (): Promise<void> => {
  const [active, connectedTo] = await Promise.all([
    chrome.tabs.query({ active: true }),
    getConnectedHost(),
  ]);
  const connectedTab = getSession()?.tabId;
  const targets = new Set(invited);

  active.forEach(tab => {
    if (tab.id !== undefined && tab.url && isWebPageUrl(tab.url)) {
      targets.add(tab.id);
    }
  });

  if (connectedTab !== undefined) {
    targets.delete(connectedTab);
    invited.delete(connectedTab);
  }

  await Promise.all(
    Array.from(targets).map(async tabId => {
      try {
        await sendToTerminal(tabId, { kind: 'invite', connectedTo });
        invited.add(tabId);
      } catch {
        invited.delete(tabId);
      }
    })
  );
};

/**
 * While an agent waits for the user, or watches with no tab to follow, shows
 * an invite on the active tab of each window but the connected one, to
 * connect it or move CLI mode there. Takes the invites away after.
 */
export const refreshInvites = (): void => {
  const agentWaiting = hasWaiters() || (isWatching() && !getSession());

  (agentWaiting ? showInvites() : takeAwayInvites()).catch(e =>
    console.error('Stylebot CLI:', e)
  );
};

/**
 * Forgets a tab's invite, the user hid it or its page went away, answering
 * whether it had one.
 */
export const forgetInvite = (tabId: number): boolean => invited.delete(tabId);
