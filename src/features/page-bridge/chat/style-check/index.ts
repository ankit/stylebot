import type { ChatCssEdit, ChatStyleProblem } from '@stylebot/types';

import { isVisible } from '../page-outline';
import { backgroundResolver, textContrast } from './colors';
import { findMissedSurfaces } from './missed-surfaces';
import {
  findOverriddenDeclarations,
  sampleEdits,
} from './overridden-declarations';
import type { Sample } from './overridden-declarations';
import { hasOwnText, pageElements, pageIsDark, settle } from './page';
import { findUnreadableText } from './unreadable-text';

const MAX_TEXTS_CHECKED = 1500;

// Properties that can change how text reads against what's behind it.
const CONTRAST_PROPERTY = /^(?:--|color$|background|all$|opacity$|filter$)/;

type Baseline = {
  edits: Array<ChatCssEdit>;
  // Read once an edit first recolors; null until then.
  contrast: Map<Element, number> | null;
  dark: boolean | null;
  samples: Array<Sample>;
};

let baseline: Baseline | null = null;

/**
 * Each visible text's contrast as the page stands.
 */
const readContrast = (): Map<Element, number> => {
  const resolveBackground = backgroundResolver();
  const contrast = new Map<Element, number>();

  pageElements(
    MAX_TEXTS_CHECKED,
    element => hasOwnText(element) && isVisible(element)
  ).forEach(element => {
    const result = textContrast(element, resolveBackground);

    if (result) {
      contrast.set(element, result.ratio);
    }
  });

  return contrast;
};

/**
 * Adds edits about to be applied to the check started by startStyleCheck:
 * the current values of the properties they set and, once an edit first
 * recolors, each text's contrast, read while the page is as it was.
 */
export const extendStyleCheck = (edits: Array<ChatCssEdit>): void => {
  if (!baseline) {
    return;
  }

  const recolors = edits.some(({ declarations }) =>
    declarations.some(({ property }) => CONTRAST_PROPERTY.test(property))
  );

  if (recolors && !baseline.contrast) {
    baseline.contrast = readContrast();
  }

  baseline.edits.push(...edits);
  baseline.samples.push(...sampleEdits(edits));
};

/**
 * Notes what the page looks like before a reply's edits are applied:
 * whether the page is dark, then what extendStyleCheck notes for the
 * edits, for checkStyle to compare against. Edits that stream in are
 * added with extendStyleCheck, each just before it applies.
 */
export const startStyleCheck = (edits: Array<ChatCssEdit>): void => {
  baseline = { edits: [], contrast: null, dark: pageIsDark(), samples: [] };
  extendStyleCheck(edits);
};

/**
 * Compares the page against what startStyleCheck noted, once the edits
 * have applied: text they made hard to read, surfaces a theme change
 * missed, and declarations that changed nothing.
 */
export const checkStyle = async (): Promise<Array<ChatStyleProblem>> => {
  const noted = baseline;
  baseline = null;

  if (!noted) {
    return [];
  }

  await settle();

  const resolveBackground = backgroundResolver();
  const dark = pageIsDark();

  return [
    ...findUnreadableText(
      noted.contrast ?? new Map(),
      resolveBackground,
      noted.edits
    ),
    ...(dark !== null && noted.dark !== null && dark !== noted.dark
      ? findMissedSurfaces(dark)
      : []),
    ...findOverriddenDeclarations(noted.samples),
  ];
};
