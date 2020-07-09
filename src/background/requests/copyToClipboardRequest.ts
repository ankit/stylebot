import BackgroundPageUtils from '../utils';
import { CopyToClipboardRequest } from '../../types/BackgroundPageRequest';

export default (request: CopyToClipboardRequest) => {
  if (request.name === 'copyToClipboard') {
    BackgroundPageUtils.copyToClipboard(request.text);
  }
};
