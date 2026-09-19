import { GoogleFont, matchGoogleFonts, matchesFontQuery } from '../fonts';

const fonts: Array<GoogleFont> = [
  { family: 'Roboto', category: 'sans-serif' },
  { family: 'Playfair Display', category: 'serif' },
  { family: 'Lora', category: 'serif' },
  { family: 'Roboto Mono', category: 'monospace' },
  { family: 'Playfair', category: 'serif' },
  { family: 'Displaced', category: 'display' },
];

global.chrome = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error: only getURL is needed here.
  runtime: {
    getURL: (path: string) => `chrome-extension://id/${path}`,
  },
};

describe('matchesFontQuery', () => {
  it('matches at the start of the name', () => {
    expect(matchesFontQuery('Playfair Display', 'play')).toBe(true);
  });

  it('matches at the start of a later word', () => {
    expect(matchesFontQuery('Playfair Display', 'dis')).toBe(true);
  });

  it('does not match mid-word', () => {
    expect(matchesFontQuery('Playfair Display', 'lay')).toBe(false);
  });

  it('ignores case and surrounding whitespace', () => {
    expect(matchesFontQuery('Roboto', '  ROB ')).toBe(true);
  });

  it('never matches an empty query', () => {
    expect(matchesFontQuery('Roboto', '   ')).toBe(false);
  });
});

describe('matchGoogleFonts', () => {
  it('returns matches in the list order', () => {
    expect(matchGoogleFonts('play', fonts).map(f => f.family)).toEqual([
      'Playfair Display',
      'Playfair',
    ]);
  });

  it('matches later words too', () => {
    expect(matchGoogleFonts('dis', fonts).map(f => f.family)).toEqual([
      'Playfair Display',
      'Displaced',
    ]);
  });

  it('honours the limit', () => {
    expect(matchGoogleFonts('rob', fonts, 1).map(f => f.family)).toEqual([
      'Roboto',
    ]);
  });

  it('returns nothing for an empty query', () => {
    expect(matchGoogleFonts('', fonts)).toEqual([]);
  });

  it('lists a category when the query names one', () => {
    expect(matchGoogleFonts('serif', fonts).map(f => f.family)).toEqual([
      'Playfair Display',
      'Lora',
      'Playfair',
    ]);
    expect(matchGoogleFonts(' Mono ', fonts).map(f => f.family)).toEqual([
      'Roboto Mono',
    ]);
    expect(matchGoogleFonts('sans', fonts, 1).map(f => f.family)).toEqual([
      'Roboto',
    ]);
  });
});

describe('loadGoogleFonts', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
    jest.resetModules();
  });

  it('fetches the bundled list from the extension and maps tuples', async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify([
        ['Roboto', 'sans-serif'],
        ['Lora', 'serif'],
      ])
    );

    const { loadGoogleFonts: load } = await import('../fonts');
    const result = await load();

    expect(fetchMock).toHaveBeenCalledWith(
      'chrome-extension://id/google-fonts/fonts.json'
    );
    expect(result).toEqual([
      { family: 'Roboto', category: 'sans-serif' },
      { family: 'Lora', category: 'serif' },
    ]);
  });

  it('memoizes a successful load', async () => {
    fetchMock.mockResponseOnce(JSON.stringify([['Roboto', 'sans-serif']]));

    const { loadGoogleFonts: load } = await import('../fonts');
    await load();
    await load();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('resolves to an empty list on failure and retries next time', async () => {
    fetchMock.mockRejectOnce(new Error('offline'));
    fetchMock.mockResponseOnce(JSON.stringify([['Roboto', 'sans-serif']]));

    const { loadGoogleFonts: load } = await import('../fonts');

    expect(await load()).toEqual([]);
    expect(await load()).toEqual([
      { family: 'Roboto', category: 'sans-serif' },
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
