import { addHelpSections } from '../help.mjs';
import { createPrinter, request } from '../request.mjs';

export const STATES = [
  'hover',
  'active',
  'focus',
  'focus-visible',
  'focus-within',
];

const count = (n, noun) => `${n} ${noun}${n === 1 ? '' : 's'}`;

const formatEntry = ({ state, selector, elements, ancestors }) =>
  `${state} on ${selector} (${count(elements, 'element')}, ${count(
    ancestors,
    'ancestor'
  )})`;

/**
 * The stylesheets whose state rules couldn't be read, so don't apply.
 */
const formatUnreadable = unreadable =>
  unreadable.length
    ? [
        `Couldn't read ${count(unreadable.length, 'stylesheet')}, so ${
          unreadable.length === 1 ? 'its' : 'their'
        } state rules don't apply:`,
        ...unreadable.map(href => `- ${href}`),
      ]
    : [];

/**
 * What a force did, then everything still forced when there's more.
 */
export const formatForce = ({ forced, changed, unreadable }, op) => {
  const lines = [];

  if (op === 'add') {
    lines.push(`Forced ${formatEntry(changed[0])}.`);
  } else if (op === 'clear') {
    lines.push(
      changed.length
        ? `Cleared ${changed
            .map(({ state, selector }) => `${state} on ${selector}`)
            .join(', ')}.`
        : 'Nothing was forced.'
    );
  }

  const others =
    op === 'add'
      ? forced.filter(
          entry =>
            entry.selector !== changed[0].selector ||
            entry.state !== changed[0].state
        )
      : forced;

  if (op === 'list' && !forced.length) {
    lines.push('Nothing is forced.');
  } else if (others.length) {
    lines.push(
      op === 'list' ? 'Forced:' : 'Also forced:',
      ...others.map(entry => `- ${formatEntry(entry)}`)
    );
  }

  return [...lines, ...formatUnreadable(unreadable)].join('\n');
};

/**
 * Adds the command that forces :hover, :active and focus states on the
 * page's elements, so their styles can be read and seen.
 */
export const addForceCommands = program => {
  const print = createPrinter(program);

  const force = program
    .command('force')
    .description('Force :hover, :active or a focus state on an element')
    .argument('<tab>', 'A tab id')
    .argument('[selector]', 'A css selector; lists what is forced if left out')
    .argument('[state]', STATES.join(' | '))
    .option('--all', 'Every match, not only the first visible one')
    .option('--clear', 'Stop forcing every state')
    .action(async (tab, selector, state, options) => {
      let op = selector === undefined ? 'list' : 'add';

      if (options.clear) {
        op = 'clear';
      }

      print(
        await request('force', {
          tab,
          selector,
          state,
          all: options.all,
          clear: options.clear,
        }),
        result => formatForce(result, op)
      );
    });

  addHelpSections(force, {
    Notes: [
      "The page's own rules for the state apply as if a real pointer or focus",
      'were there, on the element and its ancestors, until --clear, so',
      'outline, computed-styles, the css set check and screenshot see it.',
      'Only the top frame is forced.',
    ],
    Examples: [
      "$ stylebot force 1234 '.row' hover",
      "$ stylebot force 1234 'input[name=q]' focus-visible",
      '$ stylebot force 1234 --clear',
    ],
  });
};
