import type { ChatCssEdit } from '@stylebot/types';

const isString = (value: unknown): value is string => typeof value === 'string';

/**
 * Reads the tool's streamed JSON input into edits, dropping anything that
 * doesn't fit the schema; null when the JSON itself is broken (a reply cut
 * off mid-call).
 */
export const parseEdits = (json: string): Array<ChatCssEdit> | null => {
  let input: unknown;

  try {
    input = JSON.parse(json || '{}');
  } catch {
    return null;
  }

  const edits = (input as { edits?: unknown })?.edits;

  if (!Array.isArray(edits)) {
    return [];
  }

  return edits.flatMap(edit => {
    const selector = edit?.selector;
    const declarations = Array.isArray(edit?.declarations)
      ? edit.declarations.filter(
          (declaration: { property?: unknown; value?: unknown }) =>
            isString(declaration?.property) &&
            declaration.property.trim() &&
            isString(declaration.value)
        )
      : [];

    if (!isString(selector) || !selector.trim() || !declarations.length) {
      return [];
    }

    return [
      {
        selector: selector.trim(),
        declarations: declarations.map(
          ({ property, value }: { property: string; value: string }) => ({
            property: property.trim(),
            value: value.trim(),
          })
        ),
      },
    ];
  });
};
