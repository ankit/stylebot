type Args = Record<string, unknown>;

const quote = (value: unknown): string => {
  const text = String(value ?? '');
  return /^[\w.#:>=-]+$/.test(text) ? text : `'${text}'`;
};

const describeTarget = ({ selector, x, y }: Args): string =>
  selector !== undefined ? quote(selector) : `${x},${y}`;

const flags = (flag: string, values: unknown): Array<string> => {
  if (values === undefined || values === null || values === '') {
    return [];
  }

  const list = Array.isArray(values) ? values : [values];
  return list.map(value => `${flag} ${quote(value)}`);
};

const line = (...parts: Array<string | Array<string>>): string =>
  parts.flat().join(' ');

// What each command the agent runs looks like as it typed it.
const COMMAND_LINES: Record<string, (args: Args) => string> = {
  outline: () => 'outline',
  suggestions: () => 'suggestions',
  cssVariables: () => 'css-variables',
  pageRules: args => line('page-rules', quote(args.selector)),
  computedStyles: args => line('computed-styles', quote(args.selector)),
  matchCount: args =>
    line('match-count', ((args.selectors as Array<unknown>) ?? []).map(quote)),
  hover: args => line('hover', describeTarget(args)),
  inspect: args => line('inspect', describeTarget(args)),
  force: args =>
    args.clear
      ? 'force --clear'
      : line(
          'force',
          args.selector === undefined
            ? []
            : [quote(args.selector), quote(args.state)],
          args.all ? ['--all'] : []
        ),
  screenshot: args =>
    line(
      'screenshot',
      flags('--selector', args.selector),
      flags('--clip', args.clip),
      flags('--state', args.state),
      flags('--on', args.on)
    ),
  getCss: args => line('css get', flags('--grep', args.grep)),
  diffCss: () => 'css diff',
  setCss: () => 'css set',
  addCss: () => 'css add',
  editRule: args =>
    line(
      'css rule',
      quote(args.selector),
      flags(
        '--set',
        ((args.set as Array<{ property: string; value: string }>) ?? []).map(
          ({ property, value }) => `${property}=${value}`
        )
      ),
      flags('--unset', args.unset),
      args.remove ? ['--delete'] : []
    ),
  profiles: () => 'profiles',
  createProfile: args => line('profile create', quote(args.name)),
  useProfile: args => line('profile use', quote(args.profile)),
  options: () => 'options',
  setOption: args => line('option set', String(args.option), quote(args.value)),
};

/**
 * A command the agent sent, as the command line it typed, less the tab and
 * --profile; undefined for commands that don't act on a page.
 */
export const describeCommand = (
  command: string,
  args: Args
): string | undefined => COMMAND_LINES[command]?.(args);
