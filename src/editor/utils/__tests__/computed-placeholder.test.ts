import {
  computedPlaceholder,
  computedSides,
  toPlaceholder,
} from '../computed-placeholder';

describe('computed-placeholder', () => {
  describe('toPlaceholder', () => {
    it('strips px and rounds to one decimal', () => {
      expect(toPlaceholder('16px')).toBe('16');
      expect(toPlaceholder('13.3333px')).toBe('13.3');
      expect(toPlaceholder('-8px')).toBe('-8');
    });

    it('is empty for anything that is not a px length', () => {
      expect(toPlaceholder('normal')).toBe('');
      expect(toPlaceholder('4px 8px')).toBe('');
      expect(toPlaceholder('')).toBe('');
      expect(toPlaceholder()).toBe('');
    });
  });

  describe('computedPlaceholder', () => {
    const corners = (a: string, b: string) => ({
      'border-top-left-radius': a,
      'border-top-right-radius': a,
      'border-bottom-right-radius': a,
      'border-bottom-left-radius': b,
    });

    it('reads a plain property', () => {
      expect(computedPlaceholder({ 'font-size': '18px' }, 'font-size')).toBe(
        '18'
      );
    });

    it('collapses a shorthand only when its longhands agree', () => {
      expect(computedPlaceholder(corners('6px', '6px'), 'border-radius')).toBe(
        '6'
      );
      expect(computedPlaceholder(corners('6px', '0px'), 'border-radius')).toBe(
        ''
      );
    });

    it('is empty when the page has not been read', () => {
      expect(computedPlaceholder({}, 'border-width')).toBe('');
    });
  });

  it('computedSides reads each side', () => {
    expect(
      computedSides(
        {
          'margin-top': '1px',
          'margin-right': '2px',
          'margin-bottom': '3px',
          'margin-left': '4px',
        },
        {
          top: 'margin-top',
          right: 'margin-right',
          bottom: 'margin-bottom',
          left: 'margin-left',
        }
      )
    ).toEqual({ top: '1', right: '2', bottom: '3', left: '4' });
  });
});
