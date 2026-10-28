/*
 * What the css commands print, from what the extension reports.
 */

const oneLine = selector => selector.replace(/\s*\n\s*/g, ' ');

const describeRule = (selector, context) =>
  context ? `${selector} (in ${context})` : selector;

/**
 * A fragile selector as the report lists it, with the stable selector to use
 * instead and the class names that have no stable part.
 */
const describeFragileSelector = ({ selector, stable, unstable }) => {
  const advice = [];

  if (stable) {
    advice.push(`use ${oneLine(stable)}`);
  }

  if (unstable.length) {
    const verb = unstable.length === 1 ? 'has' : 'have';
    advice.push(
      `${unstable.join(
        ', '
      )} ${verb} no stable part, so select by something else`
    );
  }

  const line = `- ${oneLine(selector)}`;

  return advice.length ? `${line}: ${advice.join(', and ')}` : line;
};

/**
 * What a command that saves css did: where it saved, any notes on the edit,
 * the fonts it imported, and, when a tab shows the site, how the page took it.
 */
export const describeSave = (
  {
    url,
    deleted,
    notInUse,
    fonts,
    swappedSelectors,
    checkedTab,
    otherTabs,
    check,
    fragileSelectors,
  },
  notes = []
) => {
  if (deleted) {
    return [`Deleted the style for ${url}`, ...notes].join('\n');
  }

  const lines = [`Saved ${url}`, ...notes];

  if (fonts.length) {
    lines.push(`Imported from Google Fonts: ${fonts.join(', ')}`);
  }

  if (swappedSelectors.length) {
    lines.push(
      "Saved these selectors by the stable part of their generated class names, so they outlive the site's next build:",
      ...swappedSelectors.map(
        ({ from, to }) => `- ${oneLine(from)} → ${oneLine(to)}`
      )
    );
  }

  if (notInUse) {
    lines.push(
      `Not checked: ${notInUse} isn't the profile in use, so the page doesn't show it. \`stylebot profile use\` switches to it.`
    );
    return lines.join('\n');
  }

  if (check === null) {
    lines.push(
      'Not checked: no open tab shows a page this style applies to. Open one with `stylebot open` and save again to check it.'
    );
    return lines.join('\n');
  }

  lines.push(`Checked on tab ${checkedTab}.`);

  // An older extension leaves it out.
  if (otherTabs?.length) {
    const tabWord = otherTabs.length === 1 ? 'tab' : 'tabs';
    lines.push(
      `Also shown on ${tabWord} ${otherTabs.join(
        ', '
      )}: name a tab id instead of the site to check that tab.`
    );
  }

  if (check) {
    lines.push(check);
  }

  if (fragileSelectors.length) {
    lines.push(
      'Fragile selectors, built on class names the site generates and can change on its next build:',
      ...fragileSelectors.map(describeFragileSelector)
    );
  }

  return lines.join('\n');
};

/**
 * What css rule changed in the rule, beyond what the save reports.
 */
export const describeRuleEdit = ({
  selector,
  media,
  created,
  deleted,
  notFound,
}) => {
  const rule = describeRule(oneLine(selector), media ? `@media ${media}` : '');

  return [
    created ? `Created a rule for ${rule} at the end` : '',
    deleted ? `Removed the rule for ${rule}` : '',
    notFound.length
      ? `Not in the rule for ${rule}, so not unset: ${notFound.join(', ')}`
      : '',
  ].filter(Boolean);
};

/**
 * The rules css add added whose selector already had one.
 */
export const describeDuplicates = duplicates =>
  duplicates.length
    ? [
        'Added after rules with the same selector, which still apply where the new ones leave a property out; `stylebot css rule` edits a rule in place instead:',
        ...duplicates.map(
          ({ selector, context }) => `- ${describeRule(selector, context)}`
        ),
      ]
    : [];

/**
 * What css diff found: the rules the css would add, change and remove.
 */
export const describeDiff = ({
  url,
  diff,
  added,
  changed,
  removed,
  fonts,
  swappedSelectors,
}) => {
  if (!diff) {
    return `No rules would change in ${url}. Nothing saved.`;
  }

  const notes = [
    `Rules: ${added} added, ${changed} changed, ${removed} removed. Nothing saved.`,
    fonts.length ? `Would import from Google Fonts: ${fonts.join(', ')}` : '',
    swappedSelectors.length
      ? `Would save ${swappedSelectors.length} ${
          swappedSelectors.length === 1 ? 'selector' : 'selectors'
        } by the stable part of their generated class names, as shown`
      : '',
  ];

  return [
    `--- ${url}, as saved`,
    '+++ the css given',
    '',
    diff,
    '',
    ...notes.filter(Boolean),
  ].join('\n');
};
