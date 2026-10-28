import {
  getOpenShadowRoots,
  queryWithShadowRoots,
} from '@stylebot/stylesheets';
import type {
  PseudoStateAction,
  ForcedPseudoState,
  PseudoState,
  PseudoStateResult,
} from '@stylebot/types';

import { FORCE_ATTRIBUTE, PSEUDO_STATES } from './state-rules';
import {
  copyStateSheets,
  getUnreadableSheets,
  isStateSheetNode,
  removeStateSheets,
  type Scope,
} from './state-sheets';

type Force = { selector: string; state: PseudoState; targets: Array<Element> };

let forces: Array<Force> = [];
let marked = new Set<Element>();
let observer: MutationObserver | null = null;
let queue = Promise.resolve();
let scheduled = false;

/**
 * An element's ancestors in the flat tree, crossing slots and shadow hosts,
 * as a real pointer's hover reaches them.
 */
const getAncestors = (el: Element): Array<Element> => {
  const ancestors: Array<Element> = [];
  let node: Node | null = el.assignedSlot ?? el.parentNode;

  while (node) {
    if (node instanceof ShadowRoot) {
      node = node.host;
    } else if (node instanceof Element) {
      ancestors.push(node);
      node = node.assignedSlot ?? node.parentNode;
    } else {
      break;
    }
  }

  return ancestors;
};

/**
 * The states a forced state puts on its element and on the element's
 * ancestors: a focused element also has focus within it.
 */
const getMarkedStates = (
  state: PseudoState
): { element: Array<PseudoState>; ancestors: Array<PseudoState> } => {
  switch (state) {
    case 'hover':
    case 'active':
      return { element: [state], ancestors: [state] };
    case 'focus':
      return {
        element: ['focus', 'focus-within'],
        ancestors: ['focus-within'],
      };
    case 'focus-visible':
      return {
        element: ['focus', 'focus-visible', 'focus-within'],
        ancestors: ['focus-within'],
      };
    case 'focus-within':
      return { element: ['focus-within'], ancestors: ['focus-within'] };
  }
};

/**
 * Sets the marker attribute on each forced element and its ancestors, and
 * takes it off the elements no force covers any more.
 */
const applyMarkers = (): void => {
  const states = new Map<Element, Set<PseudoState>>();
  const mark = (el: Element, add: Array<PseudoState>) => {
    const set = states.get(el) ?? new Set();
    add.forEach(state => set.add(state));
    states.set(el, set);
  };

  forces.forEach(({ state, targets }) => {
    const { element, ancestors } = getMarkedStates(state);

    targets
      .filter(target => target.isConnected)
      .forEach(target => {
        mark(target, element);
        getAncestors(target).forEach(ancestor => mark(ancestor, ancestors));
      });
  });

  marked.forEach(el => {
    if (!states.has(el)) {
      el.removeAttribute(FORCE_ATTRIBUTE);
    }
  });

  states.forEach((set, el) => {
    const value = Array.from(set).join(' ');

    if (el.getAttribute(FORCE_ATTRIBUTE) !== value) {
      el.setAttribute(FORCE_ATTRIBUTE, value);
    }
  });

  marked = new Set(states.keys());
};

/**
 * Jumps the transitions a change of state started to their end, so a
 * screenshot or computed style shows the state rather than a frame of the fade.
 */
const finishTransitions = (): void => {
  if (typeof CSSTransition === 'undefined') {
    return;
  }

  [document, ...getOpenShadowRoots()].forEach(scope =>
    scope.getAnimations().forEach(animation => {
      if (animation instanceof CSSTransition) {
        try {
          animation.finish();
        } catch {
          // A transition that can't finish is left to run.
        }
      }
    })
  );
};

/**
 * Copies every scope's state rules again, marks the forced elements, and
 * watches the scopes for stylesheets that come and go.
 */
const rebuild = async (): Promise<void> => {
  if (!forces.length) {
    return;
  }

  const scopes: Array<Scope> = [document, ...getOpenShadowRoots()];

  await copyStateSheets(scopes);
  scopes.forEach(watch);
  applyMarkers();
  finishTransitions();
};

const enqueueRebuild = (): Promise<void> => {
  queue = queue.then(rebuild, rebuild);
  return queue;
};

const isStyleNode = (node: Node): boolean =>
  (node instanceof HTMLStyleElement || node instanceof HTMLLinkElement) &&
  !isStateSheetNode(node);

const touchesStyles = (record: MutationRecord): boolean => {
  const target =
    record.type === 'characterData' ? record.target.parentNode : record.target;

  if (target && isStyleNode(target)) {
    return true;
  }

  return [...Array.from(record.addedNodes), ...Array.from(record.removedNodes)]
    .filter((node): node is Element => node instanceof Element)
    .some(
      node =>
        isStyleNode(node) ||
        !!node.querySelector('style, link[rel~="stylesheet"]')
    );
};

/**
 * Rebuilds the copies once for a burst of changes to the page's styles.
 */
const scheduleRebuild = (): void => {
  if (!scheduled) {
    scheduled = true;
    queue = queue.then(() => {
      scheduled = false;
      return rebuild();
    });
  }
};

const onMutations = (records: Array<MutationRecord>): void => {
  if (records.some(touchesStyles)) {
    scheduleRebuild();
  }
};

// A <link> has no sheet to copy until it loads.
const onSheetLoad = (event: Event): void => {
  if (event.target instanceof HTMLLinkElement) {
    scheduleRebuild();
  }
};

let watched = new WeakSet<Scope>();

const watch = (scope: Scope): void => {
  if (!observer) {
    observer = new MutationObserver(onMutations);
    document.addEventListener('load', onSheetLoad, true);
  }

  if (watched.has(scope)) {
    return;
  }

  watched.add(scope);
  observer.observe(scope, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['media', 'disabled', 'href', 'rel'],
  });
};

const clearAll = (): void => {
  forces = [];
  applyMarkers();
  removeStateSheets();
  observer?.disconnect();
  observer = null;
  watched = new WeakSet();
  document.removeEventListener('load', onSheetLoad, true);
  finishTransitions();
};

const describe = ({ selector, state, targets }: Force): ForcedPseudoState => {
  const connected = targets.filter(target => target.isConnected);
  const ancestors = new Set(connected.flatMap(getAncestors));
  connected.forEach(target => ancestors.delete(target));

  return {
    selector,
    state,
    elements: connected.length,
    ancestors: ancestors.size,
  };
};

/**
 * The elements a force goes on: the selector's first visible match, or
 * every match with all.
 */
const findTargets = (selector: string, all: boolean): Array<Element> => {
  let matches: Array<Element>;

  try {
    matches = queryWithShadowRoots(selector);
  } catch {
    throw new Error(`Not a valid selector: ${selector}`);
  }

  if (all) {
    if (!matches.length) {
      throw new Error(`No element matches ${selector}`);
    }

    return matches;
  }

  const visible = matches.find(el => el.checkVisibility());

  if (!visible) {
    throw new Error(
      matches.length
        ? `No visible element matches ${selector}; --all forces every match`
        : `No element matches ${selector}`
    );
  }

  return [visible];
};

const isSame = (force: Force, selector: string, state: PseudoState) =>
  force.selector === selector && force.state === state;

/**
 * Forces :hover, :active or a focus state on the page's elements, lists
 * what's forced, or undoes it.
 */
export const forcePseudoStates = async (
  action: PseudoStateAction
): Promise<PseudoStateResult> => {
  let changed: Array<ForcedPseudoState> = [];

  switch (action.op) {
    case 'add': {
      if (!PSEUDO_STATES.includes(action.state)) {
        throw new Error(
          `Not a state: ${action.state}. Pass ${PSEUDO_STATES.join(', ')}`
        );
      }

      const force: Force = {
        selector: action.selector,
        state: action.state,
        targets: findTargets(action.selector, !!action.all),
      };

      forces = [
        ...forces.filter(other => !isSame(other, force.selector, force.state)),
        force,
      ];
      await enqueueRebuild();
      changed = [describe(force)];
      break;
    }
    case 'release': {
      changed = forces
        .filter(force => isSame(force, action.selector, action.state))
        .map(describe);
      forces = forces.filter(
        force => !isSame(force, action.selector, action.state)
      );

      if (forces.length) {
        await enqueueRebuild();
      } else {
        clearAll();
      }
      break;
    }
    case 'clear':
      changed = forces.map(describe);
      clearAll();
      break;
    case 'list':
      break;
  }

  return {
    forced: forces.map(describe),
    changed,
    unreadable: getUnreadableSheets(),
  };
};

/**
 * Brings the forced states up to date with the page before it's read, for
 * stylesheets changed without a mutation, such as by insertRule.
 */
export const refreshPseudoStates = async (): Promise<void> => {
  if (forces.length) {
    await enqueueRebuild();
  }
};
