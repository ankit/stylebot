import type { Timestamp } from '@stylebot/types';

const pad = (value: number, width = 2) => String(value).padStart(width, '0');

/**
 * The time now as local ISO 8601 with its UTC offset, e.g.
 * 2026-09-26T09:15:30.123-04:00, the format every stored timestamp uses.
 */
export const getCurrentTimestamp = (): Timestamp => {
  const now = new Date();
  const offset = -now.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const hours = Math.floor(Math.abs(offset) / 60);
  const minutes = Math.abs(offset) % 60;

  return (
    `${pad(now.getFullYear(), 4)}-${pad(now.getMonth() + 1)}-${pad(
      now.getDate()
    )}` +
    `T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(
      now.getSeconds()
    )}` +
    `.${pad(now.getMilliseconds(), 3)}${sign}${pad(hours)}:${pad(minutes)}`
  );
};
