import { GetCommands, GetCommandsResponse } from '@stylebot/types';

/**
 * Fetches the user's configured Stylebot keyboard shortcuts from the background.
 */
export const getCommands = (): Promise<GetCommandsResponse> => {
  return new Promise(resolve => {
    const message: GetCommands = { name: 'GetCommands' };
    chrome.runtime.sendMessage(message, (response: GetCommandsResponse) => {
      resolve(response);
    });
  });
};
