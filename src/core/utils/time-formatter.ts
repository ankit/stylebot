import { isToday } from 'date-fns';

const formatters = new Map<string, Intl.DateTimeFormat>();

/**
 * Formatted through the browser's own locale, so the clock reads the way this
 * machine is set. Formatters are kept, since building one costs far more than
 * formatting with it; a date that will not parse comes back blank.
 */
const format = (date: Date, options: Intl.DateTimeFormatOptions) => {
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const key = JSON.stringify(options);
  let formatter = formatters.get(key);

  if (!formatter) {
    formatter = new Intl.DateTimeFormat(undefined, options);
    formatters.set(key, formatter);
  }

  return formatter.format(date);
};

/**
 * The time of day. The day itself is the heading above the row, so it is not
 * repeated here.
 */
export const formatClockTime = (date: Date): string =>
  format(date, { hour: 'numeric', minute: '2-digit' });

export const formatDay = (date: Date): string =>
  format(date, { month: 'short', day: 'numeric' });

/**
 * The same day with the weekday in front, which places a date in the week
 * just gone the way nothing else does.
 */
export const formatWeekday = (date: Date): string =>
  format(date, { weekday: 'long', month: 'short', day: 'numeric' });

/**
 * A time of day, with the date in front once it is no longer today — "5:46 PM"
 * on its own would otherwise read as today whenever it was not.
 */
export const formatDayTime = (date: Date): string => {
  const time = formatClockTime(date);

  if (!time) {
    return '';
  }

  return isToday(date) ? time : `${formatDay(date)}, ${time}`;
};

export const formatExact = (date: Date): string =>
  format(date, { dateStyle: 'full', timeStyle: 'medium' });
