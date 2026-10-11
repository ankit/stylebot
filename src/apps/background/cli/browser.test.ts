import { browserName } from './browser';

const brands = (...names: Array<string>) => ({
  brands: names.map(brand => ({ brand, version: '130' })),
});

describe('browserName', () => {
  it('names the browser from its brand', () => {
    expect(
      browserName(brands('Not)A;Brand', 'Chromium', 'Google Chrome'))
    ).toBe('Chrome');
    expect(
      browserName(brands('Microsoft Edge', 'Chromium', 'Not?A_Brand'))
    ).toBe('Edge');
    expect(browserName(brands('Brave', 'Chromium', 'Not_A Brand'))).toBe(
      'Brave'
    );
  });

  it('reads as Chromium without a brand of its own', () => {
    expect(browserName(brands('Chromium', 'Not_A Brand'))).toBe('Chromium');
    expect(browserName(undefined)).toBe('Chromium');
  });
});
