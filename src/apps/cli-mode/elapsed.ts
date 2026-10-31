const format = (
  value: number,
  unit: 'minute' | 'second',
  locale: string
): string =>
  new Intl.NumberFormat(locale, {
    style: 'unit',
    unit,
    unitDisplay: 'narrow',
  }).format(value);

/**
 * How long something has taken, as a terminal counts it: "42s", "3m 5s".
 */
export const formatElapsed = (ms: number, locale: string): string => {
  const seconds = Math.max(Math.floor(ms / 1000), 0);

  if (seconds < 60) {
    return format(seconds, 'second', locale);
  }

  return `${format(Math.floor(seconds / 60), 'minute', locale)} ${format(
    seconds % 60,
    'second',
    locale
  )}`;
};
