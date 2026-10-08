import fs from 'node:fs';

import { addHelpSections } from '../help.mjs';
import { createPrinter, fail, request } from '../request.mjs';

const oneLine = selector => selector.replace(/\s*\n\s*/g, ' ');

/**
 * What css set did: where it saved, the fonts it imported, and, when a tab
 * shows the site, how the page took it, worded as Chat's model is told.
 */
const describeSave = ({
  url,
  deleted,
  fonts,
  swappedSelectors,
  checkedTab,
  check,
  fragileSelectors,
}) => {
  if (deleted) {
    return `Deleted the style for ${url}`;
  }

  const lines = [`Saved ${url}`];

  if (fonts.length) {
    lines.push(`Imported from Google Fonts: ${fonts.join(', ')}`);
  }

  if (swappedSelectors.length) {
    lines.push(
      "Saved these selectors by the stable part of their generated class names, so they outlive the site's next build:",
      ...swappedSelectors.map(
        ({ from, to }) => `- ${oneLine(from)} → ${oneLine(to)}`
      )
    );
  }

  if (check === null) {
    lines.push(
      'Not checked: no open tab shows a page this style applies to. Open one with `stylebot open` and save again to check it.'
    );
    return lines.join('\n');
  }

  lines.push(`Checked on tab ${checkedTab}.`);

  if (check) {
    lines.push(check);
  }

  if (fragileSelectors.length) {
    lines.push(
      'Fragile selectors, built on class names the site generates and can change on its next build:',
      ...fragileSelectors.map(({ selector, stable, unstable }) => {
        const use = stable ? `: use ${oneLine(stable)}` : '';
        const rest = unstable.length
          ? `${stable ? ', and' : ':'} ${unstable.join(', ')} ${
              unstable.length === 1 ? 'has' : 'have'
            } no stable part, so select by something else`
          : '';

        return `- ${oneLine(selector)}${use}${rest}`;
      })
    );
  }

  return lines.join('\n');
};

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
      'Save css from stdin, apply it and check the page; empty css deletes the style'
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
