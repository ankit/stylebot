jest.mock('../package.mjs', () => ({ CLI_VERSION: '0.2.0', LIB_DIR: '/lib' }));

const { formatSelection, parseDuration } = require('./mode.mjs');

const RECT = { x: 40, y: 120, width: 320, height: 180 };

describe('formatSelection', () => {
  it('lists each mark with the elements in its area', () => {
    expect(
      formatSelection({
        tab: 1234,
        waiting: false,
        marks: [
          {
            n: 1,
            rect: RECT,
            elements: [
              { selector: '#nav', matches: 1 },
              {
                selector: '.card',
                matches: 12,
                unique: '#main > :nth-child(2)',
              },
            ],
            whole: true,
            more: 3,
            crop: '/home/me/.stylebot/work/stylebot-mark-1234-1.png',
          },
          {
            n: 3,
            rect: { x: 0, y: 0, width: 20, height: 10 },
            elements: [{ selector: 'h1', matches: 1 }],
            whole: false,
            more: 0,
          },
        ],
      })
    ).toBe(
      [
        '2 marks on tab 1234:',
        'mark 1: 320×180 at 40,120, holding:',
        '      1  #nav',
        '     12  .card  (this one: #main > :nth-child(2))',
        '         and 3 more',
        '  saved /home/me/.stylebot/work/stylebot-mark-1234-1.png',
        'mark 3: 20×10 at 0,0, over part of:',
        '      1  h1',
      ].join('\n')
    );
  });

  it('says when there are no marks, or it is still waiting', () => {
    expect(formatSelection({ tab: 7, waiting: false, marks: [] })).toBe(
      'No marks on tab 7.'
    );
    expect(formatSelection({ tab: null, waiting: true, marks: [] })).toMatch(
      /^Still waiting: no tab is connected yet/
    );
  });
});

describe('parseDuration', () => {
  it('reads seconds, minutes and milliseconds', () => {
    expect(parseDuration('90')).toBe(90_000);
    expect(parseDuration('2m')).toBe(120_000);
    expect(parseDuration('500ms')).toBe(500);
    expect(parseDuration('soon')).toBeUndefined();
  });
});
