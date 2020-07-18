import BackgroundPageUtils from '../utils';
import { CopyToClipboardRequest } from '@stylebot/types';

export default (request: CopyToClipboardRequest): void => {
  if (request.name === 'copyToClipboard') {
    BackgroundPageUtils.copyToClipboard(request.text);
  }
};
