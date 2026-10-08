import { getStylesForPage } from '@stylebot/saved-styles';
import type { PointerAction, PointerResult } from '@stylebot/types';

import { getAll } from '../styles';
import { inspectTab, requireNamed, resolveTab } from './targets';
import type { CliCommands } from './types';

type PointerTarget = Pick<PointerAction, 'selector' | 'x' | 'y'>;

/**
 * Where a request points: a selector, or else a point.
 */
const getTarget = ({
  selector,
  x,
  y,
}: Record<string, unknown>): PointerTarget =>
  selector === undefined
    ? { x: Number(x), y: Number(y) }
    : { selector: String(selector) };

/**
 * The css saved for a page, whose selectors an inspect prefers.
 */
const getSavedCss = async (url: string | undefined): Promise<string> => {
  if (!url) {
    return '';
  }

  const { defaultStyle } = getStylesForPage(url, await getAll());
  return defaultStyle?.css ?? '';
};

/**
 * Moves the page's pointer onto the element or point a request names.
 */
const usePointer = async (
  kind: PointerAction['kind'],
  args: Record<string, unknown>
): Promise<PointerResult> => {
  requireNamed(args.tab, 'tab');
  const { id, url } = await resolveTab(args.tab);
  const action: PointerAction = { kind, ...getTarget(args) };

  if (kind === 'inspect') {
    action.css = await getSavedCss(url);
  }

  return inspectTab<PointerResult>(id as number, { kind: 'pointer', action });
};

export const pointerCommands: CliCommands = {
  hover: args => usePointer('hover', args),
  inspect: args => usePointer('inspect', args),
};
