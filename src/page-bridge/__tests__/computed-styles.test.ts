import { getComputedStyles } from '../computed-styles';

describe('getComputedStyles', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('reads the first match, skipping the editor host', () => {
    document.body.innerHTML = `
      <div id="stylebot"><h1 style="font-size: 10px">panel</h1></div>
      <h1 style="font-size: 24px; padding-top: 4px">first</h1>
      <h1 style="font-size: 30px">second</h1>
    `;

    expect(getComputedStyles('h1', ['font-size', 'padding-top'])).toEqual({
      'font-size': '24px',
      'padding-top': '4px',
    });
  });

  it('is empty for an unmatched or invalid selector', () => {
    expect(getComputedStyles('.missing', ['font-size'])).toEqual({});
    expect(getComputedStyles('h1[', ['font-size'])).toEqual({});
  });
});
