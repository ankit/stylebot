import {
  computedColorPlaceholder,
  computedFontPlaceholder,
  computedKeywordPlaceholder,
  computedPlaceholder,
  computedSides,
  toPlaceholder,
} from './computed-placeholder';

describe('computed-placeholder', () => {
  describe('toPlaceholder', () => {
    it('strips px and rounds to one decimal', () => {
      expect(toPlaceholder('16px')).toBe('16');
      expect(toPlaceholder('13.3333px')).toBe('13.3');
      expect(toPlaceholder('-8px')).toBe('-8');
    });

    it('is empty for zero and anything that is not a px length', () => {
      expect(toPlaceholder('0px')).toBe('');
      expect(toPlaceholder('0.01px')).toBe('');
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

describe('computedColorPlaceholder', () => {
  it('reads a computed color as hex', () => {
    expect(
      computedColorPlaceholder({ color: 'rgb(234, 236, 244)' }, 'color')
    ).toBe('#eaecf4');
  });

  it('leaves a transparent background empty', () => {
    expect(
      computedColorPlaceholder(
        { 'background-color': 'rgba(0, 0, 0, 0)' },
        'background-color'
      )
    ).toBe('');
  });

  it('leaves the color of an undrawn border empty', () => {
    const sides = ['top', 'right', 'bottom', 'left'];
    const styles = Object.fromEntries(
      sides.flatMap(side => [
        [`border-${side}-color`, 'rgb(255, 0, 0)'],
        [`border-${side}-style`, 'none'],
      ])
    );

    expect(computedColorPlaceholder(styles, 'border-color')).toBe('');
  });

  it('reads a border color only when every side agrees', () => {
    const sides = ['top', 'right', 'bottom', 'left'];
    const styles = Object.fromEntries(
      sides.map(side => [`border-${side}-color`, 'rgb(255, 0, 0)'])
    );

    expect(computedColorPlaceholder(styles, 'border-color')).toBe('#ff0000');
    expect(
      computedColorPlaceholder(
        { ...styles, 'border-left-color': 'rgb(0, 0, 0)' },
        'border-color'
      )
    ).toBe('');
  });
});

describe('computedFontPlaceholder', () => {
  it('reads the primary family, unquoted', () => {
    expect(
      computedFontPlaceholder({ 'font-family': '"Fira Code", monospace' })
    ).toBe('Fira Code');
  });
});

describe('computedKeywordPlaceholder', () => {
  it('maps logical text-align keywords to the left and right options', () => {
    expect(
      computedKeywordPlaceholder({ 'text-align': 'start' }, 'text-align')
    ).toBe('left');
  });

  it('reads text-decoration through its line longhand', () => {
    expect(
      computedKeywordPlaceholder(
        { 'text-decoration-line': 'underline' },
        'text-decoration'
      )
    ).toBe('underline');
  });
});
