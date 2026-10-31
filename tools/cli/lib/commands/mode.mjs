import { addHelpSections } from '../help.mjs';
import { createPrinter, request } from '../request.mjs';

/**
 * Adds the commands for CLI mode, where the user follows on their page what
 * the agent does there.
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
    ],
  });
};
