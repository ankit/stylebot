import { resolveAppearance } from './resolve-appearance';

describe('resolveAppearance', () => {
  it('returns light unchanged', () => {
    expect(resolveAppearance('light', 'dark')).toBe('light');
    expect(resolveAppearance('light', 'light')).toBe('light');
  });

  it('returns dark unchanged', () => {
    expect(resolveAppearance('dark', 'dark')).toBe('dark');
    expect(resolveAppearance('dark', 'light')).toBe('dark');
  });

  it('resolves system to the system preference', () => {
    expect(resolveAppearance('system', 'dark')).toBe('dark');
    expect(resolveAppearance('system', 'light')).toBe('light');
  });
});
