import {
  GetAllOptionsRequest,
  GetOptionRequest,
  SetOptionRequest,
  OpenOptionsPageRequest,
  GetAllOptionsResponse,
  GetOptionResponse,
  StylebotOptions,
} from '@stylebot/types';

import { saveOption } from '../options';

type Request =
  | GetAllOptionsRequest
  | GetOptionRequest
  | SetOptionRequest
  | OpenOptionsPageRequest;

type Response = GetAllOptionsResponse | GetOptionResponse;

export default (
  request: Request,
  options: StylebotOptions,
  sendResponse: (response: Response) => void
): void => {
  if (request.name === 'getAllOptions') {
    sendResponse(options);
  } else if (request.name === 'getOption') {
    sendResponse(options[request.optionName as keyof StylebotOptions]);
  } else if (request.name === 'setOption') {
    saveOption(request.option.name, request.option.value);
  } else if (request.name === 'openOptionsPage') {
    chrome.runtime.openOptionsPage();
  }
};
