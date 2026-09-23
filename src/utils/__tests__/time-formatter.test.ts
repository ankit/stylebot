import {
  formatClockTime,
  formatDay,
  formatDayTime,
  formatWeekday,
} from '../time-formatter';

const at = (day: number, hours: number, minutes: number): Date =>
  new Date(2026, 8, day, hours, minutes);

describe('formatClockTime', () => {
  it('gives a time of day without the date, which the heading carries', () => {
    const time = formatClockTime(at(21, 22, 54));

    expect(time).toMatch(/54/);
    expect(time).not.toMatch(/2026|Sep/);
  });

  it('does not go down to seconds', () => {
    expect(formatClockTime(at(21, 16, 28))).not.toMatch(/:\d\d:/);
  });

  it('returns nothing for an unparseable time', () => {
    expect(formatClockTime(new Date('nonsense'))).toBe('');
  });
});

describe('formatDay', () => {
  it('names the month and day, without a year or a time', () => {
    const day = formatDay(at(21, 22, 54));

    expect(day).toMatch(/Sep/);
    expect(day).toMatch(/21/);
    expect(day).not.toMatch(/2026|54/);
  });

  it('returns nothing for an unparseable date', () => {
    expect(formatDay(new Date('nonsense'))).toBe('');
  });
});

describe('formatWeekday', () => {
  it('puts the weekday in front of the same day', () => {
    // 21 September 2026 was a Monday.
    const day = formatWeekday(at(21, 22, 54));

    expect(day).toMatch(/Monday/);
    expect(day).toMatch(/Sep/);
    expect(day).toMatch(/21/);
  });

  it('returns nothing for an unparseable date', () => {
    expect(formatWeekday(new Date('nonsense'))).toBe('');
  });
});

describe('formatDayTime', () => {
  it('gives the time alone for today', () => {
    const now = new Date();
    const today = formatDayTime(now);

    expect(today).toBe(formatClockTime(now));
  });

  it('puts the date in front once it is no longer today', () => {
    const day = formatDayTime(at(21, 17, 46));

    expect(day).toMatch(/Sep/);
    expect(day).toMatch(/21/);
    expect(day).toMatch(/46/);
  });

  it('returns nothing for an unparseable date', () => {
    expect(formatDayTime(new Date('nonsense'))).toBe('');
  });
});
