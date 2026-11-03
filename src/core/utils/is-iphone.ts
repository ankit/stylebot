// iPad Safari reports a Mac user agent, so this matches iPhone alone.
export const isIPhone = (): boolean => /\biPhone\b/.test(navigator.userAgent);
