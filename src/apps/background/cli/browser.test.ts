import { getBrowserName } from './browser';

const brands = (...names: Array<string>) => ({
  brands: names.map(brand => ({ brand, version: '130' })),
});

describe('getBrowserName', () => {
  it('names the browser from its brand', () => {
    expect(
      getBrowserName(brands('Not)A;Brand', 'Chromium', 'Google Chrome'))
    ).toBe('Chrome');
    expect(
      getBrowserName(brands('Microsoft Edge', 'Chromium', 'Not?A_Brand'))
    ).toBe('Edge');
    expect(getBrowserName(brands('Brave', 'Chromium', 'Not_A Brand'))).toBe(
      'Brave'
    );
  });

  it('reads as Chromium without a brand of its own', () => {
    expect(getBrowserName(brands('Chromium', 'Not_A Brand'))).toBe('Chromium');
    expect(getBrowserName(undefined)).toBe('Chromium');
  });
});
