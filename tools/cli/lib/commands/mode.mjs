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

/**
 * What `selection` prints: each mark, with the elements in its area.
 */
export const formatSelection = ({ tab, waiting, marks }) => {
  if (waiting) {
    return tab === null
      ? 'Still waiting: no tab is connected yet. Run it again to keep waiting.'
      : `Still waiting: nothing new on tab ${tab}. Run it again to keep waiting.`;
  }

  if (!marks.length) {
    return `No marks on tab ${tab}.`;
  }

  return [
    `${marks.length} mark${marks.length === 1 ? '' : 's'} on tab ${tab}:`,
    ...marks.map(formatMark),
  ].join('\n');
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
      'The user marks areas of the page by dragging over them; read them',
      'with selection. Commands end with a line while some are unread.',
      'Keys on the page: . open or minimize, Z undo the last save,',
      'X clear the marks.',
    ],
  });

  const selection = program
    .command('selection')
    .description('The areas the user marked on the connected tab')
    .argument('[tab]', 'The connected tab, to check it is the one you mean')
    .option('--crop', 'Save a screenshot of each area')
    .option(
      '-o, --out <dir>',
      'Where screenshots are saved',
      WORK_DIR.replace(os.homedir(), '~')
    )
    .option('--wait', 'Wait for the user to mark something new first')
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
      'Lists each mark, its box in css pixels of the viewport, and the',
      'elements wholly inside it with match counts (or the one at its',
      'middle). --wait returns a moment after the user stops marking, and',
      'with no tab connected, waits for the user to connect one too.',
    ],
    Examples: [
      '$ stylebot selection',
      '$ stylebot selection --crop',
      '$ stylebot selection --wait --timeout 2m',
    ],
  });
};
