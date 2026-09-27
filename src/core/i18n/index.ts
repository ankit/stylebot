export const t = (msg: string, substitutions: Array<string> = []): string => {
  return chrome.i18n.getMessage(msg, substitutions);
};
