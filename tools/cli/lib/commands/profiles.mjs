import { createPrinter, request } from '../request.mjs';

/**
 * Adds the commands that list and manage a style's profiles.
 */
export const addProfileCommands = program => {
  const print = createPrinter(program);

  program.commandsGroup('Profiles');

  program
    .command('profiles')
    .description("List a style's profiles (* active)")
    .argument('[target]', 'A tab id or site; the active tab if left out')
    .action(async target =>
      print(await request('profiles', { target }), ({ profiles }) =>
        profiles
          .map(
            profile =>
              `${profile.active ? '*' : ' '} ${profile.name} (${profile.id})`
          )
          .join('\n')
      )
    );

  const profile = program
    .command('profile')
    .usage('<command> [flags]')
    .description("Create, use, rename or delete a style's profiles")
    .helpCommand(false);

  profile
    .command('create')
    .description('Add a profile, blank or a copy of another')
    .argument('<name>', 'The new profile')
    .argument('<target>', 'A tab id or site')
    .option('--from <name>', "Start from a copy of this profile's css")
    .option('--use', 'Switch to the new profile')
    .action(async (name, target, options) =>
      print(
        await request('createProfile', {
          target,
          name,
          from: options.from,
          activate: options.use,
        }),
        result => `Created ${result.name} on ${result.url}`
      )
    );

  profile
    .command('use')
    .description('Switch the profile applied to the page')
    .argument('<name>', 'The profile')
    .argument('<target>', 'A tab id or site')
    .action(async (name, target) =>
      print(
        await request('useProfile', { target, profile: name }),
        ({ url }) => `Using ${name} on ${url}`
      )
    );

  profile
    .command('rename')
    .description('Rename a profile')
    .argument('<name>', 'The profile')
    .argument('<new-name>', 'Its new name')
    .argument('<target>', 'A tab id or site')
    .action(async (name, newName, target) =>
      print(
        await request('renameProfile', {
          target,
          profile: name,
          name: newName,
        }),
        result => `Renamed ${name} to ${result.name} on ${result.url}`
      )
    );

  profile
    .command('delete')
    .description('Delete a profile')
    .argument('<name>', 'The profile')
    .argument('<target>', 'A tab id or site')
    .action(async (name, target) =>
      print(
        await request('deleteProfile', { target, profile: name }),
        ({ url }) => `Deleted ${name} from ${url}`
      )
    );
};
