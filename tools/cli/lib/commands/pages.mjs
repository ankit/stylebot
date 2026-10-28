import fs from 'node:fs';
import path from 'node:path';

import { addHelpSections } from '../help.mjs';
import { STATES } from './force.mjs';
import { createPrinter, fail, request } from '../request.mjs';

/**
 * Where a screenshot went, its size and scale, so points read off it map to
 * css pixels, and whether its element or clip was cut to the viewport.
 */
const formatScreenshot = ({
  path: out,
  width,
  height,
  scale,
  viewport,
  cutOff,
  state,
  on,
}) =>
  [
    out,
    `${width}×${height}, scale ${scale} (${scale} image px = 1 CSS px)`,
    ...(state ? [`With ${state} forced on ${on}`] : []),
    ...(cutOff
      ? [
          `Cut off: only the part inside the ${viewport.width}×${viewport.height} viewport shows`,
        ]
      : []),
  ].join('\n');

/**
 * Adds the commands that open, read and capture pages.
 */
export const addPageCommands = program => {
  const print = createPrinter(program);

  program.commandsGroup('Pages');

  program
    .command('open')
    .description("Open a page in the CLI's own window, behind yours")
    .argument('<url>', 'A url, or a bare site to match any page on it')
    .option('--new', 'Open another tab even if one shows the page')
    .action(async (url, options) =>
      print(
        await request('open', { url, forceNew: options.new }),
        tab => `${tab.created ? 'Opened' : 'Found'} ${tab.id} ${tab.url}`
      )
    );

  program
    .command('tabs')
    .description('List open tabs (* active in its window)')
    .action(async () =>
      print(await request('tabs'), tabs =>
        tabs
          .map(
            tab =>
              `${tab.active ? '*' : ' '} ${String(tab.id).padEnd(10)} ${
                tab.url
              }\n             ${tab.title}`
          )
          .join('\n')
      )
    );

  program
    .command('outline')
    .description("Print the page's visible elements as an outline")
    .argument('[tab]', 'A tab id; the active tab if left out')
    .action(async tab =>
      print(await request('outline', { tab }), outline => outline)
    );

  const screenshot = program
    .command('screenshot')
    .description('Save a PNG of a tab, or of one element or region of it')
    .argument('<tab>', 'A tab id')
    .option('-o, --out <path>', 'Where to save it')
    .option(
      '--selector <selector>',
      'Only the first visible element it matches, scrolled to if needed'
    )
    .option(
      '--clip <x,y,w,h>',
      'Only this region, in css pixels of the viewport'
    )
    .option(
      '--scale <n>',
      'Image pixels per css pixel; 2 for full resolution on a 2× screen',
      '1'
    )
    .option(
      '--state <state>',
      `Force a state while shooting: ${STATES.join(', ')}`
    )
    .option('--on <selector>', 'The element --state is forced on')
    .action(async (tab, options) => {
      if (options.selector !== undefined && options.clip !== undefined) {
        fail('Pass --selector or --clip, not both');
      }

      if ((options.state === undefined) !== (options.on === undefined)) {
        fail(
          "Pass --state with --on, the selector of the element it's forced on"
        );
      }

      const { dataUrl, ...shot } = await request('screenshot', {
        tab,
        selector: options.selector,
        clip: options.clip,
        scale: options.scale,
        state: options.state,
        on: options.on,
      });
      const out = path.resolve(options.out ?? `stylebot-${Date.now()}.png`);

      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, Buffer.from(dataUrl.split(',')[1], 'base64'));
      print(
        { path: out, ...shot, state: options.state, on: options.on },
        formatScreenshot
      );
    });

  addHelpSections(screenshot, {
    Notes: [
      'At the default scale 1, a point in the image is the css pixel that',
      'hover and inspect take, for a full screenshot. --selector scrolls back',
      'afterwards; an element bigger than the viewport is cut to what fits.',
      "--state forces a state on --on's first visible match for the shot",
      'only, as force does.',
    ],
    Examples: [
      "$ stylebot screenshot 1234 --selector '#nav .menu' -o menu.png",
      '$ stylebot screenshot 1234 --clip 0,0,600,400 --scale 2',
      "$ stylebot screenshot 1234 --state hover --on '.row' --selector '.row'",
    ],
  });

  program
    .command('done')
    .description("Close the CLI's window and its tabs")
    .action(async () =>
      print(await request('done'), ({ closed }) =>
        closed ? "Closed the CLI's window" : "The CLI's window wasn't open"
      )
    );
};
