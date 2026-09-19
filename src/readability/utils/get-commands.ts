import { GetCommands, GetCommandsResponse } from '@stylebot/types';

/**
 * Fetches the user's configured Stylebot keyboard shortcuts from the background.
 */
export const getCommands = (): Promise<GetCommandsResponse> => {
  const message: GetCommands = { name: 'GetCommands' };
  return chrome.runtime.sendMessage<GetCommands, GetCommandsResponse>(message);
};
