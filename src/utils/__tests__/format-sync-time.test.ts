import { formatSyncTime } from '../format-sync-time';

describe('formatSyncTime', () => {
  it('formats a valid timestamp as a relative time', () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    expect(formatSyncTime(oneHourAgo)).toBe('about 1 hour ago');
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
