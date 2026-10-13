import { getCssVariables } from './css-variables';

// jsdom doesn't list custom properties in computed styles, so the test
// stands in for what browsers report.
const computed = (properties: Record<string, string>) => {
  const names = Object.keys(properties);
  return Object.assign([...names], {
    getPropertyValue: (name: string) => properties[name] ?? '',
  }) as unknown as CSSStyleDeclaration;
};

describe('getCssVariables', () => {
  afterEach(() => jest.restoreAllMocks());

  it('lists html variables, then body ones that differ, colors first', () => {
    jest.spyOn(window, 'getComputedStyle').mockImplementation(element =>
      element === document.documentElement
        ? computed({ '--gap': '4px', '--bg': ' #fff' })
        : computed({
            '--gap': '4px',
            '--bg': ' #fff',
            '--text': 'rgb(1, 2, 3)',
          })
    );

    expect(getCssVariables()).toEqual([
      { name: '--bg', value: '#fff', on: 'html' },
      { name: '--text', value: 'rgb(1, 2, 3)', on: 'body' },
      { name: '--gap', value: '4px', on: 'html' },
    ]);
  });

  it('puts a big design system’s base palette ahead of its components', () => {
    const scale = Object.fromEntries(
      Array.from({ length: 60 }, (_, i) => [
        `--button-danger-scale-${i}-bgColor`,
        '#123456',
      ])
    );

    jest
      .spyOn(window, 'getComputedStyle')
      .mockImplementation(element =>
        element === document.documentElement
          ? computed({ ...scale, '--bgColor-default': '#fff' })
          : computed({})
      );

    expect(getCssVariables()[0]).toEqual({
      name: '--bgColor-default',
      value: '#fff',
      on: 'html',
    });
  });

  it('lists font stacks first, so colors can’t crowd them out', () => {
    const colors = Object.fromEntries(
      Array.from({ length: 50 }, (_, i) => [
        `--bg-${i}`,
        `#0000${i % 10}${i % 10}`,
      ])
    );

    jest.spyOn(window, 'getComputedStyle').mockImplementation(element =>
      element === document.documentElement
        ? computed({
            ...colors,
            '--fontStack-sansSerif': '-apple-system, "Segoe UI", sans-serif',
            '--fontsize-base': '14px',
          })
        : computed({})
    );

    const names = getCssVariables().map(({ name }) => name);

    expect(names[0]).toBe('--fontStack-sansSerif');
    expect(names.indexOf('--fontsize-base')).toBeGreaterThan(50);
  });

  it('spans the palette’s shades before listing more names for one color', () => {
    const whites = Object.fromEntries(
      Array.from({ length: 50 }, (_, i) => [`--surface-${i}`, '#fff'])
    );

    jest
      .spyOn(window, 'getComputedStyle')
      .mockImplementation(element =>
        element === document.documentElement
          ? computed({ ...whites, '--primary-low': 'rgb(91.3%, 91.3%, 91.3%)' })
          : computed({})
      );

    expect(
      getCssVariables()
        .slice(0, 4)
        .map(({ name }) => name)
    ).toContain('--primary-low');
  });
});
