import { differenceInCalendarDays, isToday, isYesterday } from 'date-fns';

import { formatDay, formatWeekday } from '@stylebot/utils';

export type DayGroup<T> = {
  label: string;
  entries: Array<T>;
};

/**
 * Today and yesterday are said by name. The days before them are named by
 * weekday, which only places a date while it is still this week.
 */
export const getDayLabel = (
  date: Date,
  t: (key: string, substitutions?: Array<string>) => string
): string => {
  if (isToday(date)) {
    return t('restore_group_today', [formatDay(date)]);
  }

  if (isYesterday(date)) {
    return t('restore_group_yesterday', [formatDay(date)]);
  }

  return differenceInCalendarDays(new Date(), date) < 7
    ? formatWeekday(date)
    : formatDay(date);
};

/**
 * The items gathered under the day each falls on, in the order given.
 */
export const groupByDay = <T>(
  items: Array<T>,
  dateOf: (item: T) => Date,
  label: (date: Date) => string
): Array<DayGroup<T>> => {
  const days = new Map<string, DayGroup<T>['entries']>();

  items.forEach(item => {
    const day = label(dateOf(item));
    const entries = days.get(day) ?? [];

    entries.push(item);
    days.set(day, entries);
  });

  return [...days].map(([label, entries]) => ({ label, entries }));
};
