jest.mock('../package.mjs', () => ({ CLI_VERSION: '0.2.0', LIB_DIR: '/lib' }));
jest.mock('../request.mjs', () => ({
  createPrinter: () => (result, format) => console.log(format(result)),
  fail: jest.fn(message => {
    throw new Error(message);
  }),
  request: jest.fn(),
}));

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { Command } = require('commander');

const { request } = require('../request.mjs');
const { addPageCommands } = require('./pages.mjs');

// A 1×1 PNG.
const PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

describe('stylebot screenshot', () => {
  let dir;
  let file;
  let lines;

  const runScreenshot = async args => {
    const program = new Command('stylebot').option('--json');

    addPageCommands(program);
    await program.parseAsync([
      'node',
      'stylebot',
      'screenshot',
      '12',
      '-o',
      file,
      ...args,
    ]);
  };

  beforeEach(() => {
    lines = [];
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'stylebot-screenshot-'));
    file = path.join(dir, 'shot.png');
    jest.spyOn(console, 'log').mockImplementation(line => lines.push(line));
  });

  afterEach(() => {
    jest.restoreAllMocks();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('saves the screenshot and says its size and scale', async () => {
    request.mockResolvedValue({ dataUrl: PNG, width: 1, height: 1, scale: 1 });
    await runScreenshot([]);

    expect(lines).toEqual([`${file}\n1×1, scale 1 (1 image px = 1 CSS px)`]);
    expect(fs.existsSync(file)).toBe(true);
  });

  it('saves the data url an older Stylebot sends', async () => {
    request.mockResolvedValue(PNG);
    await runScreenshot([]);

    expect(lines).toEqual([file]);
    expect(fs.existsSync(file)).toBe(true);
  });

  it.each([
    [['--selector', '#nav'], '--selector'],
    [['--clip', '0,0,10,10'], '--clip'],
    [['--state', 'hover', '--on', 'a'], '--state'],
    [['--scale', '2'], '--scale'],
    [['--clip', '0,0,10,10', '--scale', '2'], '--clip, --scale'],
  ])(
    'asks to update an older Stylebot that ignored %j',
    async (args, option) => {
      request.mockResolvedValue(PNG);

      await expect(runScreenshot(args)).rejects.toThrow(
        `Your browser's Stylebot is too old for ${option}. Update Stylebot in your browser.`
      );
      expect(fs.existsSync(file)).toBe(false);
    }
  );
});
