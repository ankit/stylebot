import BackgroundPageUtils from '../utils';

export default (text: string): void => {
  BackgroundPageUtils.copyToClipboard(text);
};
