import { addHelpSections } from '../help.mjs';
import { createPrinter, request } from '../request.mjs';

const POINT = /^(\d+(?:\.\d+)?),(\d+(?:\.\d+)?)$/;

/**
 * The request args for a selector, or for a point written as x,y.
 */
const toTarget = element => {
  const point = POINT.exec(element);

  return point
    ? { x: Number(point[1]), y: Number(point[2]) }
    : { selector: element };
};

const formatCount = matches => String(matches ?? 'invalid').padStart(7);

/**
 * The picked selector, then its alternatives with how many elements each
 * matches, starring ones the style already has rules for.
 */
const formatInspected = result =>
  [
    `${result.selector} at ${result.x},${result.y}`,
    `${formatCount(result.matches)}  ${result.selector}`,
    ...result.alternatives.map(
      ({ selector, matches, saved }) =>
        `${formatCount(matches)}  ${selector}${saved ? ' *' : ''}`
    ),
  ].join('\n');

/**
 * Adds the commands that move a pointer over the page to hover elements and
 * inspect their selectors.
 */
export const addPointerCommands = program => {
  const print = createPrinter(program);

  program.commandsGroup('Pointer');

  const hover = program
    .command('hover')
    .description('Move the pointer onto an element or point')
    .argument('<tab>', 'A tab id')
    .argument('<element>', 'A css selector, or a point in a screenshot as x,y')
    .action(async (tab, element) =>
      print(
        await request('hover', { tab, ...toTarget(element) }),
        result => `Pointer at ${result.x},${result.y} over ${result.selector}`
      )
    );

  addHelpSections(hover, {
    Notes: [
      "The page's mouse handlers run, so menus and tooltips open, but css",
      ":hover doesn't apply: the events don't come from a real mouse.",
    ],
  });

  const inspect = program
    .command('inspect')
    .description('The selector Stylebot would pick for an element or point')
    .argument('<tab>', 'A tab id')
    .argument('<element>', 'A css selector, or a point in a screenshot as x,y')
    .action(async (tab, element) =>
      print(
        await request('inspect', { tab, ...toTarget(element) }),
        formatInspected
      )
    );

  addHelpSections(inspect, {
    Notes: [
      "Prefers a selector the site's style already has, and lists other",
      'selectors for the element with how many elements each matches',
      "(* already in the style), as the editor's selector menu offers them.",
      'The page sees no events.',
    ],
    Examples: ['$ stylebot inspect 1234 640,380'],
  });
};
