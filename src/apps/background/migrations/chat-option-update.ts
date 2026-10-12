/**
 * Chat is hidden unless turned on. Keeps it shown for anyone upgrading who
 * already used it: a saved API key, a chat thread, or Chat left open.
 */
const ChatOptionUpdate = async (): Promise<void> => {
  const { options } = await chrome.storage.local.get('options');

  if (!options || 'chat' in options) {
    return;
  }

  const keys = Object.keys(await chrome.storage.local.get(null));
  const chat =
    options.mode === 'chat' ||
    keys.some(
      key => key.startsWith('chat-api-key-') || key.startsWith('chat-thread-')
    );

  await chrome.storage.local.set({ options: { ...options, chat } });
};

export default ChatOptionUpdate;
