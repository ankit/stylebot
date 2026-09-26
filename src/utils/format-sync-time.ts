// Largest unit first; a span counts in the largest unit it fills at least once.
const UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['year', 365 * 24 * 60 * 60],
  ['month', 30 * 24 * 60 * 60],
  ['day', 24 * 60 * 60],
  ['hour', 60 * 60],
  ['minute', 60],
];

let formatter: Intl.RelativeTimeFormat | null = null;

/**
 * How long ago a sync happened ("5 minutes ago", "yesterday"), in the
 * browser's language. A missing or malformed time comes back blank.
 */
export const formatSyncTime = (value?: string): string => {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  formatter ??= new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  const seconds = Math.round((date.getTime() - Date.now()) / 1000);

  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) {
      return formatter.format(Math.round(seconds / size), unit);
    }
  }

  return formatter.format(seconds, 'second');
};
