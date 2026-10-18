/**
 * Lets stylebot.dev and gallery.stylebot.dev install and preview styles via
 * postMessage, and marks <html> with `data-stylebot-bridge` to detect Stylebot.
 */
import type {
  InstallStyle,
  InstallStyleResponse,
  OpenGalleryPreview,
  PreviewGalleryStyleResponse,
  TabMessage,
} from '@stylebot/types';

type SiteMessage =
  | { type: 'stylebot:ping' }
  | {
      type: 'stylebot:install';
      id: string;
      url: string;
      name: string;
      css: string;
    }
  | { type: 'stylebot:preview'; id: string };

// The bridge's protocol version, which a page can read off <html>.
const BRIDGE_VERSION = '1';

document.documentElement.dataset.stylebotBridge = BRIDGE_VERSION;

type Reply = Record<string, unknown>;

type Handler<T extends SiteMessage['type']> = (
  message: Extract<SiteMessage, { type: T }>
) => Reply | Promise<Reply>;

const handlers: { [T in SiteMessage['type']]: Handler<T> } = {
  'stylebot:ping': () => ({ type: 'stylebot:pong' }),

  'stylebot:install': async ({ id, url, name, css }) => {
    const message: InstallStyle = {
      name: 'InstallStyle',
      url,
      profileName: name,
      css,
    };

    const response = await chrome.runtime
      .sendMessage<InstallStyle, InstallStyleResponse>(message)
      .catch((): InstallStyleResponse => ({}));

    return {
      type: 'stylebot:installed',
      id,
      profileName: response?.profileName ?? null,
    };
  },

  'stylebot:preview': async ({ id }) => {
    // It opens a tab, so only right after the user clicked, like a popup.
    if (!navigator.userActivation?.isActive) {
      return { type: 'stylebot:previewing', id, ok: false };
    }

    const message: OpenGalleryPreview = { name: 'OpenGalleryPreview', id };
    const response = await chrome.runtime
      .sendMessage<OpenGalleryPreview, PreviewGalleryStyleResponse>(message)
      .catch((): null => null);

    return { type: 'stylebot:previewing', id, ok: Boolean(response?.ok) };
  },
};

window.addEventListener('message', async (event: MessageEvent<SiteMessage>) => {
  if (event.source !== window || event.origin !== window.location.origin) {
    return;
  }

  const data = event.data;

  if (!data || !Object.hasOwn(handlers, data.type)) {
    return;
  }

  const handler = handlers[data.type] as Handler<SiteMessage['type']>;
  const reply = await handler(data);

  window.postMessage(reply, window.location.origin);
});

// A style previewed from this page was installed from its preview's tab.
chrome.runtime.onMessage.addListener((message: TabMessage) => {
  if (message.name === 'GalleryStyleInstalled') {
    window.postMessage(
      {
        type: 'stylebot:installed',
        id: message.id,
        profileName: message.profileName,
      },
      window.location.origin
    );
  }
});
