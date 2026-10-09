import { isMajorUpdate } from './release';

describe('isMajorUpdate', () => {
  it('is true when the major version goes up', () => {
    expect(isMajorUpdate('3.2.4', '4.0.0')).toBe(true);
    expect(isMajorUpdate('3.2', '4.0')).toBe(true);
  });

  it('is false for minor and patch updates', () => {
    expect(isMajorUpdate('4.0.0', '4.0.1')).toBe(false);
    expect(isMajorUpdate('4.0.0', '4.1.0')).toBe(false);
  });

  it('is false for the same version and for a downgrade', () => {
    expect(isMajorUpdate('4.0.0', '4.0.0')).toBe(false);
    expect(isMajorUpdate('4.0.0', '3.2.4')).toBe(false);
  });

  it('is false when the previous version is missing or unparseable', () => {
    expect(isMajorUpdate(undefined, '4.0.0')).toBe(false);
    expect(isMajorUpdate('', '4.0.0')).toBe(false);
    expect(isMajorUpdate('garbage', '4.0.0')).toBe(false);
    expect(isMajorUpdate('v3.2.4', '4.0.0')).toBe(false);
  });
});
