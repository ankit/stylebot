export const t = (msg: string): string => {
  return chrome.i18n.getMessage(msg);
};
