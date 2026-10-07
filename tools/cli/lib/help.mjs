/**
 * How a command reads in its parent's list: its name and arguments, without
 * the [options] Commander adds.
 */
const subcommandTerm = command =>
  command.commands.length
    ? `${command.name()} <command>`
    : [
        command.name(),
        ...command.registeredArguments.map(argument => {
          const name = `${argument.name()}${argument.variadic ? '...' : ''}`;
          return argument.required ? `<${name}>` : `[${name}]`;
        }),
      ].join(' ');

const bold = text => `\x1b[1m${text}\x1b[22m`;
const dim = text => `\x1b[2m${text}\x1b[22m`;
const rgb = (hex, text) => {
  const [r, g, b] = hex.match(/\w\w/g).map(pair => parseInt(pair, 16));
  return `\x1b[38;2;${r};${g};${b}m${text}\x1b[39m`;
};

/**
 * The extension's icon, its three bars and cursor, beside the name and
 * description. Only drawn in color, so piped help stays plain text.
 */
const banner = description => [
  '',
  `  ${rgb('#ec4d86', '▀'.repeat(16))}`,
  `  ${rgb('#1c9fc4', '▀'.repeat(11))}         ${bold('stylebot')}`,
  `  ${rgb('#e0a218', '▀'.repeat(13))} ${rgb('#2563eb', '▌')}     ${dim(
    description
  )}`,
];

// Sections a command's help ends with, after its flags, by title.
const helpSections = new Map();

export const addHelpSections = (command, sections) =>
  helpSections.set(command, sections);

/**
 * Lays help out as gh does: the description, then bold sections for usage,
 * arguments, commands and flags, then any examples. Commander strips the bold
 * when output isn't a terminal or NO_COLOR is set.
 */
const formatHelp = (command, helper) => {
  const termWidth = helper.padWidth(command, helper);
  const item = (term, description) =>
    helper.formatItem(term, termWidth, description, helper);
  const section = (title, lines) =>
    lines.length ? [helper.styleTitle(title), ...lines, ''] : [];
  const optionItems = options =>
    options.map(option =>
      item(helper.optionTerm(option), helper.optionDescription(option))
    );

  const commandGroups = new Map();

  for (const subcommand of helper.visibleCommands(command)) {
    const group = subcommand.helpGroup() || 'Commands';
    commandGroups.set(group, [
      ...(commandGroups.get(group) ?? []),
      item(
        helper.subcommandTerm(subcommand),
        helper.subcommandDescription(subcommand)
      ),
    ]);
  }

  return [
    ...(!command.parent && helper.outputHasColors
      ? banner(helper.commandDescription(command))
      : [
          helper.boxWrap(
            helper.commandDescription(command),
            helper.helpWidth ?? 80
          ),
        ]),
    '',
    ...section('Usage', [
      `  ${helper.commandUsage(command).replace('[options]', '[flags]')}`,
    ]),
    ...section(
      'Arguments',
      helper
        .visibleArguments(command)
        .map(argument =>
          item(
            helper.argumentTerm(argument),
            helper.argumentDescription(argument)
          )
        )
    ),
    ...[...commandGroups].flatMap(([title, lines]) => section(title, lines)),
    ...section('Flags', optionItems(helper.visibleOptions(command))),
    ...section(
      'Inherited flags',
      optionItems(helper.visibleGlobalOptions(command))
    ),
    ...Object.entries(helpSections.get(command) ?? {}).flatMap(
      ([title, lines]) =>
        section(
          title,
          lines.map(line => (line ? `  ${line}` : ''))
        )
    ),
    ...section('Learn more', [
      '  Use `stylebot <command> --help` for more about a command.',
      '  Read docs/cli.md for setup and how the CLI works.',
    ]),
  ]
    .join('\n')
    .replace(/\n+$/, '\n');
};

// Commander's help settings for gh-style help; subcommands inherit them.
export const helpConfiguration = {
  formatHelp,
  prepareContext(context) {
    this.helpWidth = this.helpWidth ?? context.helpWidth ?? 80;
    this.outputHasColors = context.outputHasColors;
  },
  showGlobalOptions: true,
  styleTitle: title => bold(title.toUpperCase()),
  subcommandTerm,
};
