import { describeStyleCheck } from './style-report';

describe('describeStyleCheck', () => {
  it('lists how many elements each selector matched and flags misses', () => {
    expect(describeStyleCheck(['.card', '.missing', 'p['], [1, 0, null])).toBe(
      [
        'Elements each selector matched:',
        '- .card: 1 element',
        '- .missing: 0 elements',
        '- p[: not a valid selector',
        'Edits whose selector matched nothing changed nothing.',
      ].join('\n')
    );
  });

  it('says nothing when nothing was checked', () => {
    expect(describeStyleCheck(['.card'])).toBe('');
  });

  it('lists what the page check found after the counts', () => {
    expect(
      describeStyleCheck(
        ['body'],
        [1],
        [
          {
            type: 'unreadable-text',
            selector: '.meta',
            count: 4,
            of: 4,
            color: '#333333',
            background: '#111111',
            ratio: 1.6,
            coloredBy: '--fg-muted',
          },
          {
            type: 'unreadable-text',
            selector: 'span.titleline a',
            count: 1,
            of: 30,
            color: '#8ec07c',
            background: '#fe8019',
            ratio: 1.2,
            paintedBy: 'tr:first-child td',
            coloredBy: '.titleline a',
          },
          {
            type: 'missed-surface',
            selector: '.card',
            count: 1,
            background: '#ffffff',
            page: 'dark',
          },
          {
            type: 'overridden-declaration',
            selector: 'span.tag',
            property: 'width',
            value: '80px',
          },
        ]
      )
    ).toBe(
      [
        'Elements each selector matched:',
        '- body: 1 element',
        'Problems the page check found:',
        '- Hard to read: 4 elements colored by your `--fg-muted` (#333333), such as .meta on #111111, contrast 1.6:1',
        '- Hard to read: span.titleline a (1 of the 30 elements it matches), text #8ec07c set by your `.titleline a` on #fe8019 painted by your `tr:first-child td`, contrast 1.2:1',
        '- Still light on a now dark page: .card (1 element), background #ffffff',
        '- No effect: width: 80px on span.tag, overridden by the page or not applicable to that element',
      ].join('\n')
    );
  });
});
