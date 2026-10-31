import { formatElapsed } from './elapsed';

describe('formatElapsed', () => {
  it('counts seconds, then minutes and seconds', () => {
    expect(formatElapsed(999, 'en')).toBe('0s');
    expect(formatElapsed(42_400, 'en')).toBe('42s');
    expect(formatElapsed(185_000, 'en')).toBe('3m 5s');
  });
});
