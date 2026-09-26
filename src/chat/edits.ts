import * as postcss from 'postcss';

import {
  addDeclaration,
  findRule,
  getDeclarationsForSelector,
  withoutImportant,
} from '@stylebot/css';
import type {
  ChatCssEdit,
  ChatCssPreviousValue,
  CssLineRange,
} from '@stylebot/types';

const currentValue = (
  css: string,
  selector: string,
  property: string
): string | null => {
  const declarations = getDeclarationsForSelector(css, selector) ?? [];
  const match = [...declarations]
    .reverse()
    .find(declaration => declaration.property === property);

  return match ? match.value : null;
};

/**
 * Applies a reply's edits to the stylesheet, noting what each declaration
 * held before so the reply can later be undone on its own. A selector the
 * stylesheet can't hold (invalid CSS) is skipped.
 */
export const applyEdits = (
  css: string,
  edits: Array<ChatCssEdit>
): { css: string; previous: Array<ChatCssPreviousValue> } => {
  const previous: Array<ChatCssPreviousValue> = [];
  const seen = new Set<string>();
  let next = css;

  edits.forEach(({ selector, declarations }) => {
    declarations.forEach(({ property, value }) => {
      let updated: string;

      try {
        // Stylebot adds !important itself unless the user opted out; one
        // kept in the value would be doubled, and the declaration dropped.
        updated = addDeclaration(
          property,
          withoutImportant(value),
          selector,
          next
        );
      } catch {
        return;
      }

      const key = `${selector}\n${property}`;

      if (!seen.has(key)) {
        seen.add(key);
        previous.push({
          selector,
          property,
          value: currentValue(next, selector, property),
        });
      }

      next = updated;
    });
  });

  return { css: next, previous };
};

/**
 * Puts back what a reply's edits replaced. Later edits to the same
 * properties are overwritten too, as undoing any single change would.
 */
export const revertEdits = (
  css: string,
  previous: Array<ChatCssPreviousValue>
): string =>
  [...previous].reverse().reduce((next, { selector, property, value }) => {
    try {
      return addDeclaration(property, value ?? '', selector, next);
    } catch {
      return next;
    }
  }, css);

/**
 * How many lines the edits come to as a stylesheet: each rule's selector
 * line and closing brace around one line per declaration.
 */
export const countCssLines = (edits: Array<ChatCssEdit>): number =>
  edits.reduce((count, edit) => count + edit.declarations.length + 2, 0);

/**
 * The lines of the stylesheet a reply's edits account for: a whole rule it
 * created, or just the declarations it set on a rule that was already
 * there. Overlapping and adjacent ranges are merged.
 */
export const findEditLines = (
  css: string,
  edits: Array<ChatCssEdit>,
  previous: Array<ChatCssPreviousValue>
): Array<CssLineRange> => {
  let root: postcss.Root;

  try {
    root = postcss.parse(css);
  } catch {
    return [];
  }

  const ranges: Array<CssLineRange> = [];
  const lineRange = (node: postcss.Node) =>
    node.source?.start && node.source.end
      ? { startLine: node.source.start.line, endLine: node.source.end.line }
      : null;

  edits.forEach(({ selector, declarations }) => {
    const rule = findRule(root, selector);

    if (!rule) {
      return;
    }

    const createdRule = previous
      .filter(value => value.selector === selector)
      .every(value => value.value === null);

    if (createdRule) {
      const range = lineRange(rule);
      if (range) {
        ranges.push(range);
      }
      return;
    }

    const properties = new Set(
      declarations.filter(({ value }) => value).map(({ property }) => property)
    );

    rule.each(node => {
      const range =
        node.type === 'decl' && properties.has(node.prop)
          ? lineRange(node)
          : null;

      if (range) {
        ranges.push(range);
      }
    });
  });

  return ranges
    .sort((a, b) => a.startLine - b.startLine)
    .reduce<Array<CssLineRange>>((merged, range) => {
      const last = merged[merged.length - 1];

      if (last && range.startLine <= last.endLine + 1) {
        last.endLine = Math.max(last.endLine, range.endLine);
      } else {
        merged.push({ ...range });
      }

      return merged;
    }, []);
};
