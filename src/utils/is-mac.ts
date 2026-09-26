export const isMac = (): boolean =>
  /mac/i.test(navigator.platform || navigator.userAgent);
