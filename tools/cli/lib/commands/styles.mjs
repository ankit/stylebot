import fs from 'node:fs';

import { addHelpSections } from '../help.mjs';
import { createPrinter, fail, request } from '../request.mjs';

const describeSave = ({ url, deleted }) =>
  deleted ? `Deleted the style for ${url}` : `Saved ${url}`;

const readStdin = async () => {
  if (process.stdin.isTTY) {
    fail('css set reads css from stdin or --file');
  }

  const chunks = [];

  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks).toString();
};

/**
 * Adds the commands that list, read and save styles.
 */
export const addStyleCommands = program => {
  const print = createPrinter(program);

  program.commandsGroup('Styles');

  program
    .command('styles')
    .description('List saved styles')
    .action(async () =>
      print(await request('styles'), styles =>
        styles
          .map(
            style =>
              `${style.enabled ? ' ' : '-'} ${style.url} (${
                style.css.split('\n').length
              } lines)`
          )
          .join('\n')
      )
    );

  const css = program
    .command('css')
    .usage('<command> [flags]')
    .description("Get or set a style's css")
    .helpCommand(false);

  addHelpSections(css, {
    Examples: [
      '$ stylebot css get news.ycombinator.com',
      '$ stylebot css set news.ycombinator.com < hn.css',
      '$ stylebot css set news.ycombinator.com --file hn.css --profile Dark',
    ],
  });

  css
    .command('get')
    .description("Print a style's css")
    .argument('[target]', 'A tab id or site; the active tab if left out')
    .option('-p, --profile <name>', 'A profile other than the active one')
    .action(async (target, options) =>
      print(
        await request('getCss', { target, profile: options.profile }),
        // console.log adds the newline back, so piping into css set round-trips.
        ({ css }) => css.replace(/\n$/, '')
      )
    );

  css
    .command('set')
    .description(
      'Save css from stdin and apply it; empty css deletes the style'
    )
    .argument('<target>', 'A tab id or site')
    .option('-f, --file <path>', 'Read the css from a file instead')
    .option('-p, --profile <name>', 'A profile other than the active one')
    .action(async (target, options) => {
      const text = options.file
        ? fs.readFileSync(options.file, 'utf8')
        : await readStdin();

      print(
        await request('setCss', {
          target,
          css: text,
          profile: options.profile,
        }),
        describeSave
      );
    });
};
