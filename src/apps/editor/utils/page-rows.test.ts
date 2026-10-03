import { getPageRows } from './page-rows';

describe('getPageRows', () => {
  it('leaves out covered properties and their longhands, most visual first', () => {
    expect(
      getPageRows(
        [
          { property: 'vertical-align', value: 'top' },
          { property: 'font-size', value: '10pt' },
          { property: 'color', value: 'black' },
          { property: 'padding-top', value: '4px' },
          { property: 'font-family', value: 'Verdana' },
        ],
        ['font-size', 'padding']
      )
    ).toEqual([
      { property: 'color', value: 'black' },
      { property: 'font-family', value: 'Verdana' },
      { property: 'vertical-align', value: 'top' },
    ]);
  });

  it('merges complete sets of longhands and shows colors as hex', () => {
    expect(
      getPageRows(
        [
          { property: 'outline-color', value: 'rgb(255, 0, 0)' },
          ...['top', 'right', 'bottom', 'left'].map(side => ({
            property: `margin-${side}`,
            value: '0px',
          })),
        ],
        []
      )
    ).toEqual([
      { property: 'margin', value: '0px' },
      { property: 'outline-color', value: '#ff0000' },
    ]);
  });
});
