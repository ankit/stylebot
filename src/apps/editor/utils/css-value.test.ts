import {
  extractLength,
  extractColor,
  extractBorderStyle,
  parseLength,
} from './css-value';

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

describe('parseLength', () => {
  it('splits a px length', () => {
    expect(parseLength('16px')).toEqual({ length: '16', unit: 'px' });
  });

  it('keeps decimals, negatives and a leading dot', () => {
    expect(parseLength('-0.05em')).toEqual({ length: '-0.05', unit: 'em' });
    expect(parseLength('.5rem')).toEqual({ length: '.5', unit: 'rem' });
  });

  it('reads a unitless number as unitless', () => {
    expect(parseLength('1.6')).toEqual({ length: '1.6', unit: '' });
  });

  it('reads a unitless zero as px', () => {
    expect(parseLength('0')).toEqual({ length: '0', unit: 'px' });
  });

  it('ignores surrounding space', () => {
    expect(parseLength(' 12px ')).toEqual({ length: '12', unit: 'px' });
  });

  it('rejects keywords and lists', () => {
    expect(parseLength('normal')).toBeNull();
    expect(parseLength('1px 2px')).toBeNull();
    expect(parseLength('calc(1em + 2px)')).toBeNull();
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
    expect(extractColor('1px solid rgba(68, 71, 90, 0.5)')).toBe(
      'rgba(68, 71, 90, 0.5)'
    );
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
