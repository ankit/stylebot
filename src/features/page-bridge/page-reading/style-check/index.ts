import type { CssEdit, StyleProblem } from '@stylebot/types';

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
  edits: Array<CssEdit>;
  // Null when no edit recolors.
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
 * Notes what the page looks like before the edits are applied, for
 * checkStyle to compare against: whether the page is dark, the current
 * values of the properties they set and, when they recolor, each text's
 * contrast.
 */
export const startStyleCheck = (edits: Array<CssEdit>): void => {
  const recolors = edits.some(({ declarations }) =>
    declarations.some(({ property }) => CONTRAST_PROPERTY.test(property))
  );

  baseline = {
    edits,
    contrast: recolors ? readContrast() : null,
    dark: pageIsDark(),
    samples: sampleEdits(edits),
  };
};

/**
 * Compares the page against what startStyleCheck noted, once the edits
 * have applied: text they made hard to read, surfaces a theme change
 * missed, and declarations that changed nothing.
 */
export const checkStyle = async (): Promise<Array<StyleProblem>> => {
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
