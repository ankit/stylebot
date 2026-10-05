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
  contrast: Map<Element, number>;
  dark: boolean | null;
  samples: Array<Sample>;
};

let baseline: Baseline | null = null;

/**
 * Notes what the page looks like before a reply's edits are applied: each
 * text's contrast, whether the page is dark, and the current values of
 * the properties the edits set, for checkStyle to compare against.
 */
export const startStyleCheck = (edits: Array<ChatCssEdit>): void => {
  const resolveBackground = backgroundResolver();
  const contrast = new Map<Element, number>();
  const recolors = edits.some(({ declarations }) =>
    declarations.some(({ property }) => CONTRAST_PROPERTY.test(property))
  );

  if (recolors) {
    pageElements(
      MAX_TEXTS_CHECKED,
      element => hasOwnText(element) && isVisible(element)
    ).forEach(element => {
      const result = textContrast(element, resolveBackground);

      if (result) {
        contrast.set(element, result.ratio);
      }
    });
  }

  baseline = {
    edits,
    contrast,
    dark: pageIsDark(),
    samples: sampleEdits(edits),
  };
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
    ...findUnreadableText(noted.contrast, resolveBackground, noted.edits),
    ...(dark !== null && noted.dark !== null && dark !== noted.dark
      ? findMissedSurfaces(dark)
      : []),
    ...findOverriddenDeclarations(noted.samples),
  ];
};
