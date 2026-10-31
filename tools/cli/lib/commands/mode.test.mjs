jest.mock('../package.mjs', () => ({ CLI_VERSION: '0.2.0', LIB_DIR: '/lib' }));
jest.mock('../request.mjs', () => ({
  createPrinter: jest.fn(() => jest.fn()),
  fail: jest.fn(),
  request: jest.fn(),
}));

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { Command } = require('commander');

const { request } = require('../request.mjs');
const {
  addModeCommands,
  formatEvent,
  formatSelection,
  parseDuration,
  parseSay,
} = require('./mode.mjs');

// A 1×1 PNG.
const PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

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

  it('lists each note with its marks and screenshot, then marks not sent yet', () => {
    const mark = n => ({
      n,
      rect: { x: 0, y: 0, width: 20, height: 10 },
      elements: [{ selector: 'h1', matches: 1 }],
      whole: true,
      more: 0,
    });

    expect(
      formatSelection({
        tab: 7,
        waiting: false,
        notes: [
          {
            id: 4,
            text: 'make this bigger\nand blue',
            marks: [mark(1)],
            image: '/home/me/.stylebot/work/stylebot-note-7-4.png',
          },
          { id: 6, text: 'hide the ads', marks: [] },
        ],
        marks: [mark(2)],
      })
    ).toBe(
      [
        '2 notes on tab 7:',
        '> make this bigger',
        '> and blue',
        '  screenshot of the marked area: /home/me/.stylebot/work/stylebot-note-7-4.png',
        '  mark 1: 20×10 at 0,0, holding:',
        '        1  h1',
        '> hide the ads',
        '',
        '1 mark on tab 7, not sent with a note yet:',
        'mark 2: 20×10 at 0,0, holding:',
        '      1  h1',
      ].join('\n')
    );
  });

  it('says when there are no marks or notes, or it is still waiting', () => {
    expect(
      formatSelection({ tab: 7, waiting: false, notes: [], marks: [] })
    ).toBe('No marks or notes on tab 7.');
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

describe('parseSay', () => {
  it('takes a leading tab id, and the rest as the message', () => {
    expect(parseSay(['1234', 'made', 'it', 'bigger'])).toEqual({
      tab: '1234',
      message: 'made it bigger',
    });
  });

  it('leaves the tab out when only a message is given', () => {
    expect(parseSay(['made it bigger'])).toEqual({
      tab: undefined,
      message: 'made it bigger',
    });
    expect(parseSay(['42'])).toEqual({ tab: undefined, message: '42' });
  });
});

describe('formatEvent', () => {
  it('prints one line for each thing the user does', () => {
    expect(
      [
        { type: 'attached', tab: 7, url: 'https://example.com/' },
        { type: 'mark', n: 1, width: 200, height: 40 },
        { type: 'unmark', n: 1 },
        {
          type: 'note',
          tab: 7,
          id: 4,
          text: 'make "this" bigger',
          marks: [1, 2],
          image: '/home/me/.stylebot/work/stylebot-note-7-4.png',
        },
        { type: 'note', tab: 7, id: 5, text: 'hide the ads', marks: [] },
        { type: 'navigated', url: 'https://example.com/next' },
        { type: 'style-edited', url: 'example.com' },
        { type: 'off' },
        { type: 'closed' },
      ].map(formatEvent)
    ).toEqual([
      'attached tab 7 https://example.com/',
      'mark ① area 200×40',
      'unmark ①',
      'note "make \\"this\\" bigger" about ①② (screenshot /home/me/.stylebot/work/stylebot-note-7-4.png)',
      'note "hide the ads"',
      'navigated https://example.com/next',
      'style-edited example.com',
      'mode off',
      'tab closed',
    ]);
  });

  it('says how the user connects a tab while it waits for one', () => {
    expect(formatEvent({ type: 'waiting' })).toMatch(
      /^waiting for a tab: ask the user .* or run: stylebot mode <tab>$/
    );
  });
});

describe('watch', () => {
  let lines;
  let dir;

  /**
   * Runs `stylebot watch` with the extension sending events, collecting the
   * lines it prints.
   */
  const runWatch = async (args, events) => {
    const program = new Command('stylebot').option('--json');

    request.mockImplementation(async (_command, _args, onEvent) => {
      events.forEach(event => onEvent({ ...event }));
      return { tab: null };
    });
    addModeCommands(program);
    await program.parseAsync(['node', 'stylebot', ...args]);
  };

  const EVENTS = [
    { type: 'waiting' },
    { type: 'attached', tab: 7, url: 'https://example.com/' },
    { type: 'note', tab: 7, id: 4, text: 'bigger', marks: [1], image: PNG },
  ];

  beforeEach(() => {
    lines = [];
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'stylebot-watch-'));
    jest.spyOn(console, 'log').mockImplementation(line => lines.push(line));
  });

  afterEach(() => {
    jest.restoreAllMocks();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it("streams the extension's events a line each, saving note screenshots", async () => {
    await runWatch(['watch', '-o', dir], EVENTS);

    const file = path.join(dir, 'stylebot-note-7-4.png');

    expect(request).toHaveBeenCalledWith(
      'watch',
      { tab: undefined },
      expect.any(Function)
    );
    expect(lines.slice(1)).toEqual([
      'attached tab 7 https://example.com/',
      `note "bigger" about ① (screenshot ${file})`,
    ]);
    expect(fs.existsSync(file)).toBe(true);
  });

  it('prints an object a line with --json', async () => {
    await runWatch(['watch', '12', '--json', '-o', dir], EVENTS);

    expect(request).toHaveBeenCalledWith(
      'watch',
      { tab: '12' },
      expect.any(Function)
    );
    expect(lines.map(line => JSON.parse(line))).toEqual([
      EVENTS[0],
      EVENTS[1],
      { ...EVENTS[2], image: path.join(dir, 'stylebot-note-7-4.png') },
    ]);
  });
});
