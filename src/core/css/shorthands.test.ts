import { mergeShorthands } from './shorthands';

describe('mergeShorthands', () => {
  it('collapses all four sides into the shorthand', () => {
    expect(
      mergeShorthands([
        { property: 'color', value: 'red' },
        { property: 'padding-top', value: '4px' },
        { property: 'padding-right', value: '0px' },
        { property: 'padding-bottom', value: '2px' },
        { property: 'padding-left', value: '0px' },
      ])
    ).toEqual([
      { property: 'color', value: 'red' },
      { property: 'padding', value: '4px 0px 2px' },
    ]);
  });

  it('collapses two opposite sides into their block or inline shorthand', () => {
    expect(
      mergeShorthands([
        { property: 'padding-top', value: '4px' },
        { property: 'padding-bottom', value: '2px' },
        { property: 'margin-right', value: '0px' },
        { property: 'margin-left', value: '0px' },
      ])
    ).toEqual([
      { property: 'padding-block', value: '4px 2px' },
      { property: 'margin-inline', value: '0px' },
    ]);
  });

  it('keeps a lone side as a longhand', () => {
    const declarations = [{ property: 'padding-top', value: '4px' }];

    expect(mergeShorthands(declarations)).toEqual(declarations);
  });

  it('collapses a uniform border', () => {
    const sides = ['top', 'right', 'bottom', 'left'];

    expect(
      mergeShorthands(
        sides.flatMap(side => [
          { property: `border-${side}-width`, value: '1px' },
          { property: `border-${side}-style`, value: 'solid' },
          { property: `border-${side}-color`, value: 'red' },
        ])
      )
    ).toEqual([{ property: 'border', value: '1px solid red' }]);
  });
});
