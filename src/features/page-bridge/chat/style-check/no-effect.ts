import type { ChatCssEdit, ChatStyleProblem } from '@stylebot/types';

import { queryPage } from '../count-matches';
import { hasStatePseudo } from '../state-pseudos';
import { MAX_PROBLEMS } from './page';

const MAX_SAMPLES = 3;

export type Sample = {
  selector: string;
  property: string;
  value: string;
  elements: Array<Element>;
  before: Array<string>;
};

/**
 * The current values of the properties the edits set, on a few of the
 * elements each selector matches.
 */
export const sampleEdits = (edits: Array<ChatCssEdit>): Array<Sample> =>
  edits.flatMap(({ selector, declarations }) => {
    if (hasStatePseudo(selector)) {
      return [];
    }

    const elements = queryPage(selector, MAX_SAMPLES);

    if (!elements?.length) {
      return [];
    }

    return declarations
      .filter(({ property, value }) => value && !property.startsWith('--'))
      .map(({ property, value }) => ({
        selector,
        property,
        value,
        elements,
        before: elements.map(element =>
          getComputedStyle(element).getPropertyValue(property)
        ),
      }));
  });

/**
 * What the value computes to on an element in the same place, so a value
 * the page overrides can be told from one the element already had.
 */
const probeValue = (
  element: Element,
  property: string,
  value: string
): string => {
  const parent = element.parentElement;

  if (!parent) {
    return '';
  }

  const probe = document.createElement('div');
  probe.style.setProperty('visibility', 'hidden');
  probe.style.setProperty(property, value);
  parent.appendChild(probe);
  const computed = getComputedStyle(probe).getPropertyValue(property);
  probe.remove();
  return computed;
};

/**
 * Declarations that changed nothing on the elements sampled, though the
 * value would have taken elsewhere: the page overrides them.
 */
export const findNoEffect = (samples: Array<Sample>): Array<ChatStyleProblem> =>
  samples
    .filter(({ elements, before, property, value }) => {
      const after = elements.map(element =>
        getComputedStyle(element).getPropertyValue(property)
      );

      if (after.some((computed, index) => computed !== before[index])) {
        return false;
      }

      const probed = probeValue(elements[0], property, value);
      return probed !== '' && probed !== before[0];
    })
    .slice(0, MAX_PROBLEMS)
    .map(({ selector, property, value }) => ({
      type: 'no-effect',
      selector,
      property,
      value,
    }));
