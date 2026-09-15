import { resolveAppearance } from './resolve-appearance';

describe('resolveAppearance', () => {
  it('returns light unchanged', () => {
    expect(resolveAppearance('light', true)).toBe('light');
    expect(resolveAppearance('light', false)).toBe('light');
  });

  it('returns dark unchanged', () => {
    expect(resolveAppearance('dark', true)).toBe('dark');
    expect(resolveAppearance('dark', false)).toBe('dark');
  });

  it('resolves system to dark when the OS prefers dark', () => {
    expect(resolveAppearance('system', true)).toBe('dark');
  });

  it('resolves system to light when the OS prefers light', () => {
    expect(resolveAppearance('system', false)).toBe('light');
  });
});
