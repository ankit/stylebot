/**
 * Drives Stylebot in a running browser from the command line: lists tabs,
 * reads and inspects pages, gets and sets styles, takes screenshots. Talks to
 * the extension through the native host (host.mjs) that `install` registers.
 */
import { Command } from 'commander';

import {
  getConnectedBrowsers,
  describeBrowsers,
  useBrowser,
} from './browsers.mjs';
import { addForceCommands } from './commands/force.mjs';
import { addInspectCommands } from './commands/inspect.mjs';
import { addModeCommands } from './commands/mode.mjs';
import { addOptionCommands } from './commands/options.mjs';
import { addPageCommands } from './commands/pages.mjs';
import { addPointerCommands } from './commands/pointer.mjs';
import { addProfileCommands } from './commands/profiles.mjs';
import { addStyleCommands } from './commands/styles.mjs';
import { addHelpSections, helpConfiguration } from './help.mjs';
import { install } from './install.mjs';
import { CLI_VERSION } from './package.mjs';
import { createPrinter, fail } from './request.mjs';

const program = new Command('stylebot')
  .usage('<command> [flags]')
  .description('Restyle pages in a browser running Stylebot.')
  .configureHelp(helpConfiguration)
  .helpOption('-h, --help', 'Show help')
  .version(CLI_VERSION, '-v, --version', 'Show the version')
  .option('--json', 'Print the raw JSON response')
  .option(
    '--browser <name>',
    'The browser to use, from `stylebot browsers`, when Stylebot runs in several'
  )
  .showHelpAfterError('(run stylebot --help for usage)');

addHelpSections(program, {
  Arguments: [
    'tab       A tab id, from `stylebot tabs` or `stylebot open`',
    'target    A tab id, or a site such as news.ycombinator.com',
    "name      A profile's name or id",
    '',
    'Commands that change a style, take a screenshot, move the pointer or',
    'force a state need the tab or site named. The rest default to the',
    'active tab; ones that take selectors name a tab with --tab.',
    '',
    'When Stylebot runs in several browsers, name one with --browser, from',
    '`stylebot browsers`. On a terminal, the CLI asks which.',
  ],
  Examples: [
    '$ stylebot open news.ycombinator.com',
    '$ stylebot css set news.ycombinator.com < hn.css',
    '$ stylebot screenshot 1234 -o page.png',
  ],
});

addPageCommands(program);
addInspectCommands(program);
addPointerCommands(program);
addForceCommands(program);
addModeCommands(program);
addStyleCommands(program);
addProfileCommands(program);
addOptionCommands(program);

program.hook('preAction', () => {
  const { browser } = program.opts();

  if (browser) {
    useBrowser(browser);
  }
});

program.commandsGroup('Setup');

program
  .command('browsers')
  .description('List the browsers running Stylebot, to name with --browser')
  .action(async () => {
    const { browsers } = await getConnectedBrowsers();

    createPrinter(program)(
      browsers.map(({ key, name, page }) => ({ key, name, page })),
      () =>
        browsers.length
          ? describeBrowsers(browsers).join('\n')
          : "Stylebot isn't connected in any browser. Run `stylebot install` to see why."
    );
  });

program
  .command('install')
  .description('Register the CLI with your browsers')
  .action(install);

program.helpCommand('help [command]', 'Show help for a command');

program.parseAsync().catch(error => fail(error.message));
