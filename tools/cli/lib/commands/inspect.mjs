import { addHelpSections } from '../help.mjs';
import { createPrinter, request } from '../request.mjs';

/**
 * Adds the commands that read the page as Chat does: its suggestions, its
 * css, computed values and selector matches.
 */
export const addInspectCommands = program => {
  const print = createPrinter(program);

  program.commandsGroup('Inspect');

  program
    .command('suggestions')
    .description('Requests that suit the page, as Chat suggests them')
    .argument('[tab]', 'A tab id; the active tab if left out')
    .action(async tab =>
      print(await request('suggestions', { tab }), suggestions =>
        suggestions
          .map(
            (suggestion, i) =>
              `${i + 1}. ${suggestion.label}\n   ${suggestion.request}`
          )
          .join('\n')
      )
    );

  program
    .command('css-variables')
    .description("The page's css variables, as the rules that set them")
    .argument('[tab]', 'A tab id; the active tab if left out')
    .action(async tab =>
      print(
        await request('cssVariables', { tab }),
        css => css || 'The page sets no css variables'
      )
    );

  const pageRules = program
    .command('page-rules')
    .description("The page's own css rules for the elements a selector matches")
    .argument('<selector>', 'A css selector')
    .option('-t, --tab <id>', 'A tab id; the active tab if left out')
    .action(async (selector, options) =>
      print(
        await request('pageRules', { tab: options.tab, selector }),
        css => css || `No readable page rules for ${selector}`
      )
    );

  addHelpSections(pageRules, {
    Examples: ["$ stylebot page-rules '.titleline > a'"],
  });

  const computedStyles = program
    .command('computed-styles')
    .description('Computed values on the first element a selector matches')
    .argument('<selector>', 'A css selector')
    .argument('[property...]', 'Properties to read; common ones if left out')
    .option('-t, --tab <id>', 'A tab id; the active tab if left out')
    .action(async (selector, properties, options) =>
      print(
        await request('computedStyles', {
          tab: options.tab,
          selector,
          properties,
        }),
        styles =>
          Object.keys(styles).length
            ? Object.entries(styles)
                .map(([property, value]) => `${property}: ${value};`)
                .join('\n')
            : `No element matches ${selector}`
      )
    );

  addHelpSections(computedStyles, {
    Examples: [
      '$ stylebot computed-styles body color background-color font-size',
    ],
  });

  const matchCount = program
    .command('match-count')
    .description('How many elements each selector matches')
    .argument('<selector...>', 'Css selectors')
    .option('-t, --tab <id>', 'A tab id; the active tab if left out')
    .action(async (selectors, options) =>
      print(
        await request('matchCount', { tab: options.tab, selectors }),
        counts =>
          counts
            .map(
              ({ selector, count }) =>
                `${String(count ?? 'invalid').padStart(7)}  ${selector}`
            )
            .join('\n')
      )
    );

  addHelpSections(matchCount, {
    Examples: ["$ stylebot match-count '.titleline > a' '.subline'"],
  });
};
