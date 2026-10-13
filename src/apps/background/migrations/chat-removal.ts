/**
 * Clears what Chat left behind once it was removed: its API keys, model
 * choices and threads, and an editor left on Chat, which opens Basic.
 */
const ChatRemoval = async (): Promise<void> => {
  const items = await chrome.storage.local.get(null);
  const keys = Object.keys(items).filter(key => key.startsWith('chat-'));

  if (keys.length > 0) {
    await chrome.storage.local.remove(keys);
  }

  const options = items['options'];

  if (options?.mode === 'chat') {
    await chrome.storage.local.set({ options: { ...options, mode: 'basic' } });
  }
};

export default ChatRemoval;
