import { formatSyncTime } from '../format-sync-time';

const ago = (ms: number) => new Date(Date.now() - ms).toISOString();

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe('formatSyncTime', () => {
  it.each([
    [30 * SECOND, '30 seconds ago'],
    [6 * MINUTE, '6 minutes ago'],
    [HOUR, '1 hour ago'],
    [3 * HOUR, '3 hours ago'],
    [DAY, 'yesterday'],
    [5 * DAY, '5 days ago'],
  ])('formats %d ms ago as "%s"', (ms, expected) => {
    expect(formatSyncTime(ago(ms))).toBe(expected);
  });

  it('returns an empty string for undefined', () => {
    expect(formatSyncTime(undefined)).toBe('');
  });

  it('returns an empty string for an empty value', () => {
    expect(formatSyncTime('')).toBe('');
  });

  it('returns an empty string instead of throwing on an invalid date', () => {
    expect(formatSyncTime('not-a-date')).toBe('');
  });
});
