import os from 'node:os';
import path from 'node:path';

import { addHelpSections } from '../help.mjs';
import { STATE_DIR } from '../paths.mjs';
import { savePng } from '../png.mjs';
import { createPrinter, fail, request } from '../request.mjs';

const DURATION = /^(\d+(?:\.\d+)?)(ms|s|m)?$/;
const UNIT_MS = { ms: 1, s: 1000, m: 60_000 };

// Where crops go unless -o names a folder.
const WORK_DIR = path.join(STATE_DIR, 'work');

/**
 * Milliseconds in a duration such as 90s, 2m or 500ms; plain numbers are
 * seconds. Undefined when it isn't one.
 */
export const parseDuration = value => {
  const match = DURATION.exec(String(value).trim());

  return match
    ? Math.round(Number(match[1]) * UNIT_MS[match[2] ?? 's'])
    : undefined;
};

const formatCount = matches => String(matches ?? 'invalid').padStart(7);

const formatElement = ({ selector, matches, unique }) =>
  `${formatCount(matches)}  ${selector}${
    unique ? `  (this one: ${unique})` : ''
  }`;

const listsWhat = ({ elements, whole }) => {
  if (!elements.length) {
    return '';
  }

  return whole ? ', holding:' : ', over part of:';
};

const formatMark = ({ n, rect, elements, whole, more, crop }) =>
  [
    `mark ${n}: ${rect.width}×${rect.height} at ${rect.x},${rect.y}${listsWhat({
      elements,
      whole,
    })}`,
    ...elements.map(formatElement),
    ...(more ? [`         and ${more} more`] : []),
    ...(crop ? [`  saved ${crop}`] : []),
  ].join('\n');

const indent = text =>
  text
    .split('\n')
    .map(line => `  ${line}`)
    .join('\n');

/**
 * A note the user sent, then the marks it was about, as they were then.
 */
const formatNote = ({ text, marks, image }) =>
  [
    ...text.split('\n').map(line => `> ${line}`),
    ...(image ? [`  screenshot of the marked area: ${image}`] : []),
    ...marks.map(mark => indent(formatMark(mark))),
  ].join('\n');

/**
 * What `selection` prints: the notes the user sent with their marks, then
 * the marks not sent with a note yet.
 */
export const formatSelection = ({ tab, waiting, notes = [], marks }) => {
  if (waiting) {
    return tab === null
      ? 'Still waiting: no tab is connected yet. Run it again to keep waiting.'
      : `Still waiting: nothing new on tab ${tab}. Run it again to keep waiting.`;
  }

  if (!notes.length && !marks.length) {
    return `No marks or notes on tab ${tab}.`;
  }

  const lines = [];

  if (notes.length) {
    lines.push(
      `${notes.length} note${notes.length === 1 ? '' : 's'} on tab ${tab}:`,
      ...notes.map(formatNote)
    );
  }

  if (notes.length && marks.length) {
    lines.push('');
  }

  if (marks.length) {
    lines.push(
      `${marks.length} mark${marks.length === 1 ? '' : 's'} on tab ${tab}${
        notes.length ? ', not sent with a note yet' : ''
      }:`,
      ...marks.map(formatMark)
    );
  }

  return lines.join('\n');
};

/**
 * The tab and the message in what `say` was given: a leading tab id is
 * optional, and the rest is the message.
 */
export const parseSay = words => {
  const [first, ...rest] = words;
  const named = rest.length > 0 && /^\d+$/.test(first);

  return {
    tab: named ? first : undefined,
    message: (named ? rest : words).join(' '),
  };
};

/**
 * Adds the commands for CLI mode, where the user follows on their page what
 * the agent does there, and marks areas of it for the agent.
 */
export const addModeCommands = program => {
  const print = createPrinter(program);

  program.commandsGroup('CLI mode');

  const mode = program
    .command('mode')
    .description(
      "Connect the user's tab, which shows them what you do there in a terminal"
    )
    .argument('<tab>', 'A tab id')
    .option('--off', 'Disconnect it')
    .action(async (tab, options) =>
      print(await request('mode', { tab, on: !options.off }), ({ on }) =>
        on ? `CLI mode is on in tab ${tab}.` : `CLI mode is off in tab ${tab}.`
      )
    );

  addHelpSections(mode, {
    Notes: [
      'Brings the tab to the front with its terminal open, which lists each',
      'command you run on the tab and each save, with an undo. Connecting',
      'another tab moves CLI mode there. tabs marks the connected tab',
      '[CLI mode], and open returns it rather than opening a copy.',
      'The user marks areas of the page by dragging over them and writes',
      'notes about them; read both with selection, and answer with say.',
      'Commands end with a line while some are unread.',
      'Keys on the page: . open or minimize, / write a note, Z undo the',
      'last save, X clear the marks.',
    ],
  });

  const selection = program
    .command('selection')
    .description(
      'The notes the user sent and the areas they marked on the connected tab'
    )
    .argument('[tab]', 'The connected tab, to check it is the one you mean')
    .option('--crop', 'Save a screenshot of each area')
    .option(
      '-o, --out <dir>',
      'Where screenshots are saved',
      WORK_DIR.replace(os.homedir(), '~')
    )
    .option('--wait', 'Wait for a new note or mark first')
    .option('--timeout <duration>', 'How long --wait waits', '90s')
    .action(async (tab, options) => {
      const timeout = parseDuration(options.timeout);

      if (timeout === undefined) {
        fail(
          `--timeout takes a duration such as 90s or 2m: ${options.timeout}`
        );
      }

      const result = await request('selection', {
        tab,
        crop: Boolean(options.crop),
        wait: Boolean(options.wait),
        timeout: options.wait ? timeout : undefined,
      });
      const dir = options.out.replace(/^~(?=$|[/\\])/, os.homedir());

      for (const note of result.notes) {
        if (note.image) {
          note.image = savePng(
            note.image,
            path.join(dir, `stylebot-note-${result.tab}-${note.id}.png`)
          );
        }
      }

      for (const mark of result.marks) {
        if (mark.dataUrl) {
          mark.crop = savePng(
            mark.dataUrl,
            path.join(dir, `stylebot-mark-${result.tab}-${mark.n}.png`)
          );
          delete mark.dataUrl;
        }
      }

      print(result, formatSelection);
    });

  addHelpSections(selection, {
    Notes: [
      'Lists each note the user sent since you last looked, with the marks',
      'it was about as they were then and a screenshot of the area around',
      'them, then the marks not sent with a note yet. Each mark has its box',
      'in css pixels of the viewport and the elements wholly inside it with',
      'match counts (or the one at its middle). --wait returns once a note',
      'comes or a moment after the user stops marking, and with no tab',
      'connected, waits for the user to connect one too.',
    ],
    Examples: [
      '$ stylebot selection',
      '$ stylebot selection --crop',
      '$ stylebot selection --wait --timeout 2m',
    ],
  });

  const say = program
    .command('say')
    .description("Answer the user's note in the connected tab's terminal")
    .usage('[tab] <message>')
    .argument('<words...>', 'The connected tab (optional), then the message')
    .action(async words =>
      print(
        await request('say', parseSay(words)),
        ({ tab }) => `Said on tab ${tab}.`
      )
    );

  addHelpSections(say, {
    Notes: [
      "Shows the message under the user's last note, opening the terminal",
      'if it was collapsed. Until you answer, the terminal shows you working',
      "on the note while you run commands; say what you did once it's done.",
    ],
    Examples: ["$ stylebot say 'Made the header sticky and bigger.'"],
  });
};
