import { isForceImportant } from '../force-important';

describe('isForceImportant', () => {
  it('is true unless a style stores forceImportant: false', () => {
    expect(isForceImportant({})).toBe(true);
    expect(isForceImportant({ forceImportant: true })).toBe(true);
    expect(isForceImportant({ forceImportant: false })).toBe(false);
  });

  it('is true for a missing style', () => {
    expect(isForceImportant(undefined)).toBe(true);
  });
});
