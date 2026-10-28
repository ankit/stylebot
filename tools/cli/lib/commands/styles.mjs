import fs from 'node:fs';

import {
  describeDiff,
  describeDuplicates,
  describeRuleEdit,
  describeSave,
} from '../css-reports.mjs';
import { addHelpSections } from '../help.mjs';
import { createPrinter, fail, request } from '../request.mjs';

/**
 * The name and value of each `--set prop=value`.
 */
const parseSet = (pairs = []) =>
  pairs.map(pair => {
    const at = pair.indexOf('=');

    if (at < 1) {
      fail(`--set takes property=value, not ${pair}`);
    }

    return { property: pair.slice(0, at).trim(), value: pair.slice(at + 1) };
  });

const collect = (value, previous = []) => [...previous, value];

/**
 * The css a command reads, from --file or else stdin.
 */
const readCss = async (command, options) =>
  options.file ? fs.readFileSync(options.file, 'utf8') : readStdin(command);

const readStdin = async command => {
  if (process.stdin.isTTY) {
    fail(`css ${command} reads css from stdin or --file`);
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
    .description("Read or change a style's css")
    .helpCommand(false);

  addHelpSections(css, {
    Examples: [
      '$ stylebot css get news.ycombinator.com --grep header',
      "$ stylebot css rule news.ycombinator.com '.title' --set color=#333 --set 'font-size=16px'",
      "$ stylebot css rule 1234 '.title' --media '(max-width: 600px)' --unset font-size",
      '$ stylebot css add news.ycombinator.com < more.css',
      '$ stylebot css diff news.ycombinator.com --file hn.css',
      '$ stylebot css set news.ycombinator.com --file hn.css --profile Dark',
    ],
  });

  const verboseOption = [
    '--verbose',
    "Report every selector's match count, not only the changed rules'",
  ];
  const profileOption = [
    '-p, --profile <name>',
    'A profile other than the active one',
  ];

  css
    .command('get')
    .description("Print a style's css, or only the rules that match --grep")
    .argument('[target]', 'A tab id or site; the active tab if left out')
    .option(...profileOption)
    .option(
      '-g, --grep <text>',
      'Only rules whose selector or declarations contain the text'
    )
    .action(async (target, options) =>
      print(
        await request('getCss', {
          target,
          profile: options.profile,
          grep: options.grep,
        }),
        ({ url, css: text, grep }) =>
          grep && !text
            ? `No rules in ${url} match "${grep}"`
            : // console.log adds the newline back, so piping into css set round-trips.
              text.replace(/\n$/, '')
      )
    );

  css
    .command('rule')
    .description(
      'Edit one rule: set or unset declarations, creating the rule at the end if none matches, or delete it'
    )
    .argument('<target>', 'A tab id, to check that tab, or a site')
    .argument(
      '<selector>',
      'The selector of the first top-level rule to edit, written exactly'
    )
    .option(
      '-s, --set <property=value>',
      'Set a declaration; repeat for more',
      collect
    )
    .option(
      '-u, --unset <property>',
      'Remove a declaration; repeat for more',
      collect
    )
    .option('--delete', 'Delete the rule')
    .option('-m, --media <query>', 'The rule inside this top-level @media')
    .option(...profileOption)
    .option(...verboseOption)
    .action(async (target, selector, options) => {
      if (!options.set && !options.unset && !options.delete) {
        fail('css rule needs --set, --unset or --delete');
      }

      if (options.delete && (options.set || options.unset)) {
        fail('css rule --delete takes no --set or --unset');
      }

      const result = await request('editRule', {
        target,
        selector,
        media: options.media,
        set: parseSet(options.set),
        unset: options.unset ?? [],
        remove: Boolean(options.delete),
        profile: options.profile,
        verbose: Boolean(options.verbose),
      });

      const edit = { ...result.edit, selector, media: options.media };

      print(result, saved => describeSave(saved, describeRuleEdit(edit)));
    });

  css
    .command('add')
    .description(
      'Add css from stdin to the end of the style, apply it and check the page'
    )
    .argument('<target>', 'A tab id, to check that tab, or a site')
    .option('-f, --file <path>', 'Read the css from a file instead')
    .option(...profileOption)
    .option(...verboseOption)
    .action(async (target, options) => {
      const result = await request('addCss', {
        target,
        css: await readCss('add', options),
        profile: options.profile,
        verbose: Boolean(options.verbose),
      });

      print(result, saved =>
        describeSave(saved, describeDuplicates(saved.duplicates))
      );
    });

  css
    .command('set')
    .description(
      'Replace the css with css from stdin, apply it and check the page; empty css deletes the style'
    )
    .argument('<target>', 'A tab id, to check that tab, or a site')
    .option('-f, --file <path>', 'Read the css from a file instead')
    .option(...profileOption)
    .option(...verboseOption)
    .action(async (target, options) =>
      print(
        await request('setCss', {
          target,
          css: await readCss('set', options),
          profile: options.profile,
          verbose: Boolean(options.verbose),
        }),
        saved => describeSave(saved)
      )
    );

  css
    .command('diff')
    .description(
      'Show the rules css from stdin would add, change and remove, saving nothing'
    )
    .argument('<target>', 'A tab id or site')
    .option('-f, --file <path>', 'Read the css from a file instead')
    .option(...profileOption)
    .action(async (target, options) =>
      print(
        await request('diffCss', {
          target,
          css: await readCss('diff', options),
          profile: options.profile,
        }),
        describeDiff
      )
    );
};
