import { createPrinter, request } from '../request.mjs';

/**
 * Adds the commands that read and set the options a style's css declares,
 * such as its light/dark mode.
 */
export const addOptionCommands = program => {
  const print = createPrinter(program);

  program.commandsGroup('Style options');

  program
    .command('options')
    .description("List the options a profile's css declares, with their values")
    .argument('[target]', 'A tab id or site; the active tab if left out')
    .option('--profile <name>', 'Read this profile rather than the one in use')
    .action(async (target, options) =>
      print(
        await request('options', { target, profile: options.profile }),
        ({ options: declared }) =>
          declared.length
            ? declared
                .map(
                  option =>
                    `${option.name}: ${option.value} (${option.values.join(
                      ', '
                    )}; default ${option.default})`
                )
                .join('\n')
            : 'No options declared'
      )
    );

  const option = program
    .command('option')
    .usage('<command> [flags]')
    .description('Set an option a profile declares')
    .helpCommand(false);

  option
    .command('set')
    .description('Set an option, applying it to open tabs')
    .argument('<option>', 'The option, such as scheme')
    .argument('<value>', 'One of the values it declares')
    .argument('<target>', 'A tab id or site')
    .option(
      '--profile <name>',
      'Set it for this profile rather than the one in use'
    )
    .action(async (name, value, target, options) =>
      print(
        await request('setOption', {
          target,
          profile: options.profile,
          option: name,
          value,
        }),
        ({ url }) => `Set ${name} to ${value} on ${url}`
      )
    );
};
