// Chromium's user agent carries "Safari/" too, so it's ruled out by "Chrome/".
export const isSafari = (): boolean =>
  /Safari\//.test(navigator.userAgent) && !/Chrome\//.test(navigator.userAgent);
