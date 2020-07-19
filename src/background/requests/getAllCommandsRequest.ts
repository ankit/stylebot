import { GetAllCommandsResponse } from 'types';

export default (
  sendResponse: (response: GetAllCommandsResponse) => void
): void => {
  chrome.commands.getAll(commands =>
    sendResponse(commands as GetAllCommandsResponse)
  );
};
