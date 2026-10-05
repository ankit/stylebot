import type { ChatCssEdit } from '@stylebot/types';

const isString = (value: unknown): value is string => typeof value === 'string';

/**
 * Reads one entry of the tool's edits list, dropping declarations that don't
 * fit the schema; null when nothing usable is left.
 */
export const parseEdit = (edit: unknown): ChatCssEdit | null => {
  const { selector, declarations } = (edit ?? {}) as {
    selector?: unknown;
    declarations?: unknown;
  };
  const valid = Array.isArray(declarations)
    ? declarations.filter(
        (declaration: { property?: unknown; value?: unknown }) =>
          isString(declaration?.property) &&
          declaration.property.trim() &&
          isString(declaration.value)
      )
    : [];

  if (!isString(selector) || !selector.trim() || !valid.length) {
    return null;
  }

  return {
    selector: selector.trim(),
    declarations: valid.map(
      ({ property, value }: { property: string; value: string }) => ({
        property: property.trim(),
        value: value.trim(),
      })
    ),
  };
};

/**
 * The raw edits list of the tool's JSON input; null when the JSON itself is
 * broken (a reply cut off mid-call).
 */
export const readEditsList = (json: string): Array<unknown> | null => {
  let input: unknown;

  try {
    input = JSON.parse(json || '{}');
  } catch {
    return null;
  }

  const edits = (input as { edits?: unknown })?.edits;
  return Array.isArray(edits) ? edits : [];
};
