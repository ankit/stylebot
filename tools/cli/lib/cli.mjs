/**
 * Drives Stylebot in a running browser from the command line: lists tabs,
 * reads and inspects pages, gets and sets styles, takes screenshots. Talks to
 * the extension through the native host (host.mjs) that `install` registers.
 */
import { Command } from 'commander';

import { addInspectCommands } from './commands/inspect.mjs';
import { addPageCommands } from './commands/pages.mjs';
import { addProfileCommands } from './commands/profiles.mjs';
import { addStyleCommands } from './commands/styles.mjs';
import { addHelpSections, helpConfiguration } from './help.mjs';
import { install } from './install.mjs';
import { CLI_VERSION } from './package.mjs';
import { fail } from './request.mjs';

const program = new Command('stylebot')
  .usage('<command> [flags]')
  .description('Restyle pages in a browser running Stylebot.')
  .configureHelp(helpConfiguration)
  .helpOption('-h, --help', 'Show help')
  .version(CLI_VERSION, '-v, --version', 'Show the version')
  .option('--json', 'Print the raw JSON response')
  .showHelpAfterError('(run stylebot --help for usage)');

addHelpSections(program, {
  Arguments: [
    'tab       A tab id, from `stylebot tabs` or `stylebot open`',
    'target    A tab id, or a site such as news.ycombinator.com',
    "name      A profile's name or id",
    '',
    'Commands that change a style or take a screenshot need the tab or',
    'site named. The rest default to the active tab; ones that take',
    'selectors name a tab with --tab.',
  ],
  Examples: [
    '$ stylebot open news.ycombinator.com',
    '$ stylebot css set news.ycombinator.com < hn.css',
    '$ stylebot screenshot 1234 -o page.png',
  ],
});

addPageCommands(program);
addInspectCommands(program);
addStyleCommands(program);
addProfileCommands(program);

program.commandsGroup('Setup');

program
  .command('install')
  .description('Register the CLI with your browsers')
  .action(install);

program.helpCommand('help [command]', 'Show help for a command');

program.parseAsync().catch(error => fail(error.message));
