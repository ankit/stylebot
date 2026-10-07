import fs from 'node:fs';
import path from 'node:path';

import { createPrinter, request } from '../request.mjs';

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

  program
    .command('screenshot')
    .description('Save a PNG of a tab')
    .argument('<tab>', 'A tab id')
    .option('-o, --out <path>', 'Where to save it')
    .action(async (tab, options) => {
      const dataUrl = await request('screenshot', { tab });
      const out = path.resolve(options.out ?? `stylebot-${Date.now()}.png`);

      fs.writeFileSync(out, Buffer.from(dataUrl.split(',')[1], 'base64'));
      console.log(out);
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
