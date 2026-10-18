/**
 * Lets stylebot.dev and gallery.stylebot.dev install, preview and check styles
 * via postMessage, and marks <html> with `data-stylebot-bridge` for detection.
 */
import type { TabMessage } from '@stylebot/types';

import { handleSiteRequest } from './handlers';
import {
  BRIDGE_VERSION,
  type InstalledEvent,
  type SiteRequest,
} from './protocol';

document.documentElement.dataset.stylebotBridge = BRIDGE_VERSION;

const post = (message: unknown) =>
  window.postMessage(message, window.location.origin);

window.addEventListener('message', async (event: MessageEvent<SiteRequest>) => {
  if (event.source !== window || event.origin !== window.location.origin) {
    return;
  }

  const reply = await handleSiteRequest(event.data);

  if (reply) {
    post(reply);
  }
});

chrome.runtime.onMessage.addListener((message: TabMessage) => {
  if (message.name === 'GalleryStyleInstalled') {
    const installed: InstalledEvent = {
      type: 'stylebot:event:installed',
      id: message.id,
      profileName: message.profileName,
    };

    post(installed);
  }
});
