import { extractLength, extractColor, extractBorderStyle } from '../css-value';

describe('extractLength', () => {
  it('extracts a px length from a shorthand value', () => {
    expect(extractLength('1px solid #44475a')).toBe('1px');
  });

  it('extracts a decimal px length', () => {
    expect(extractLength('0.5px dashed red')).toBe('0.5px');
  });

  it('returns empty when no length is present', () => {
    expect(extractLength('solid red')).toBe('');
  });
});

describe('extractColor', () => {
  it('extracts a hex color', () => {
    expect(extractColor('1px solid #44475a')).toBe('#44475a');
  });

  it('extracts a short hex color', () => {
    expect(extractColor('solid #fff')).toBe('#fff');
  });

  it('extracts an rgba() color', () => {
    expect(extractColor('1px solid rgba(68, 71, 90, 0.5)')).toBe('rgba(68, 71, 90, 0.5)');
  });

  it('returns empty when no color is present', () => {
    expect(extractColor('1px solid')).toBe('');
  });
});

describe('extractBorderStyle', () => {
  it('extracts a known border-style keyword', () => {
    expect(extractBorderStyle('1px solid #44475a')).toBe('solid');
  });

  it('finds the keyword regardless of token order', () => {
    expect(extractBorderStyle('#44475a dashed 2px')).toBe('dashed');
  });

  it('returns empty when no style keyword is present', () => {
    expect(extractBorderStyle('1px #44475a')).toBe('');
  });
});
