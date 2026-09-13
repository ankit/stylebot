import {
  parseLength,
  expandShorthand,
  collapseToShorthand,
  resolveSpacingDeclarations,
  EMPTY_SIDES,
  Sides,
} from '../spacing';

const properties: Sides = {
  top: 'padding-top',
  right: 'padding-right',
  bottom: 'padding-bottom',
  left: 'padding-left',
};

describe('parseLength', () => {
  it('strips the px unit', () => {
    expect(parseLength('4px')).toBe('4');
    expect(parseLength('-4px')).toBe('-4');
  });

  it('returns empty for a non-px unit', () => {
    expect(parseLength('4em')).toBe('');
    expect(parseLength('4%')).toBe('');
  });

  it('returns empty for an empty value', () => {
    expect(parseLength('')).toBe('');
  });
});

describe('expandShorthand', () => {
  it('expands a 1-value shorthand to all sides', () => {
    expect(expandShorthand('4px')).toEqual({ top: '4px', right: '4px', bottom: '4px', left: '4px' });
  });

  it('expands a 2-value shorthand to vertical/horizontal', () => {
    expect(expandShorthand('2px 4px')).toEqual({
      top: '2px',
      right: '4px',
      bottom: '2px',
      left: '4px',
    });
  });

  it('expands a 3-value shorthand', () => {
    expect(expandShorthand('2px 4px 6px')).toEqual({
      top: '2px',
      right: '4px',
      bottom: '6px',
      left: '4px',
    });
  });

  it('expands a 4-value shorthand', () => {
    expect(expandShorthand('1px 2px 3px 4px')).toEqual({
      top: '1px',
      right: '2px',
      bottom: '3px',
      left: '4px',
    });
  });

  it('returns null for an empty or over-long value', () => {
    expect(expandShorthand('')).toBeNull();
    expect(expandShorthand('1px 2px 3px 4px 5px')).toBeNull();
  });
});

describe('collapseToShorthand', () => {
  it('collapses to a single value when all sides match', () => {
    expect(collapseToShorthand({ top: '4', right: '4', bottom: '4', left: '4' })).toBe('4px');
  });

  it('collapses to a 2-value form when vertical/horizontal pairs match', () => {
    expect(collapseToShorthand({ top: '2', right: '4', bottom: '2', left: '4' })).toBe('2px 4px');
  });

  it('collapses to a 3-value form when only left/right match', () => {
    expect(collapseToShorthand({ top: '2', right: '4', bottom: '6', left: '4' })).toBe(
      '2px 4px 6px'
    );
  });

  it('falls back to the full 4-value form', () => {
    expect(collapseToShorthand({ top: '1', right: '2', bottom: '3', left: '4' })).toBe(
      '1px 2px 3px 4px'
    );
  });
});

describe('resolveSpacingDeclarations', () => {
  it('uses the specific longhand property when only one side is set', () => {
    const sides: Sides = { top: '4', right: '', bottom: '', left: '' };

    expect(resolveSpacingDeclarations(sides, properties, 'padding')).toEqual([
      { property: 'padding', value: '' },
      { property: 'padding-top', value: '4px' },
      { property: 'padding-right', value: '' },
      { property: 'padding-bottom', value: '' },
      { property: 'padding-left', value: '' },
    ]);
  });

  it('clears every declaration when no side is set', () => {
    expect(resolveSpacingDeclarations(EMPTY_SIDES, properties, 'padding')).toEqual([
      { property: 'padding', value: '' },
      { property: 'padding-top', value: '' },
      { property: 'padding-right', value: '' },
      { property: 'padding-bottom', value: '' },
      { property: 'padding-left', value: '' },
    ]);
  });

  it('prefers the shorthand once two sides are set, defaulting the rest to 0', () => {
    const sides: Sides = { top: '4', right: '', bottom: '4', left: '' };

    expect(resolveSpacingDeclarations(sides, properties, 'padding')).toEqual([
      { property: 'padding', value: '4px 0px' },
      { property: 'padding-top', value: '' },
      { property: 'padding-right', value: '' },
      { property: 'padding-bottom', value: '' },
      { property: 'padding-left', value: '' },
    ]);
  });

  it('prefers the shorthand and collapses it optimally when all four sides are set', () => {
    const sides: Sides = { top: '4', right: '4', bottom: '4', left: '4' };

    expect(resolveSpacingDeclarations(sides, properties, 'padding')).toEqual([
      { property: 'padding', value: '4px' },
      { property: 'padding-top', value: '' },
      { property: 'padding-right', value: '' },
      { property: 'padding-bottom', value: '' },
      { property: 'padding-left', value: '' },
    ]);
  });
});
