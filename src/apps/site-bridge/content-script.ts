/**
 * Lets stylebot.dev install gallery styles. The page posts `stylebot:ping`
 * to find out Stylebot is here, and `stylebot:install` with the style's url,
 * name and css; each gets an answer posted back to the page.
 */
import type { InstallStyle, InstallStyleResponse } from '@stylebot/types';

type SiteMessage =
  | { type: 'stylebot:ping' }
  | {
      type: 'stylebot:install';
      id: string;
      url: string;
      name: string;
      css: string;
    };

const reply = (data: Record<string, unknown>) =>
  window.postMessage(data, window.location.origin);

window.addEventListener('message', async (event: MessageEvent<SiteMessage>) => {
  if (event.source !== window || event.origin !== window.location.origin) {
    return;
  }

  const data = event.data;

  if (data?.type === 'stylebot:ping') {
    reply({ type: 'stylebot:pong' });
  } else if (data?.type === 'stylebot:install') {
    const message: InstallStyle = {
      name: 'InstallStyle',
      url: data.url,
      profileName: data.name,
      css: data.css,
    };

    const response = await chrome.runtime
      .sendMessage<InstallStyle, InstallStyleResponse>(message)
      .catch((): InstallStyleResponse => ({}));

    reply({
      type: 'stylebot:installed',
      id: data.id,
      profileName: response?.profileName ?? null,
    });
  }
});
