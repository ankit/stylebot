import { format } from 'date-fns';

import { getCurrentTimestamp } from '../timestamp';

describe('getCurrentTimestamp', () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  // Winter and summer, so a zone with daylight saving is checked in both.
  it.each([
    '2026-09-26T13:15:30.123Z',
    '2026-01-01T00:00:00.000Z',
    '2026-03-08T07:30:05.009Z',
    '1999-12-31T23:59:59.999Z',
  ])("matches date-fns' yyyy-MM-dd'T'HH:mm:ss.SSSxxx at %s", instant => {
    jest.useFakeTimers().setSystemTime(new Date(instant));

    expect(getCurrentTimestamp()).toBe(
      format(new Date(), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx")
    );
  });

  // Minutes behind UTC, as getTimezoneOffset reports them.
  it.each([
    [240, '-04:00'],
    [0, '+00:00'],
    [-330, '+05:30'],
    [-345, '+05:45'],
    [-765, '+12:45'],
  ])('writes an offset of %d minutes as %s', (offset, suffix) => {
    jest.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(offset);

    expect(getCurrentTimestamp().endsWith(suffix)).toBe(true);
  });
});
