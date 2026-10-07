/**
 * Mirrors Stylebot's stylesheets into every open shadow root on the page,
 * since a document-level <style> never reaches into a shadow tree. Closed
 * shadow roots stay out of reach.
 */

const getStylesheetId = (id: string) => `stylebot-css-${id}`;

// Roots Stylebot mounts its own UI in; the page's CSS must not leak into them.
const STYLEBOT_HOST_IDS = ['stylebot', 'stylebot-reader'];

const isStylebotHost = (el: Element): boolean =>
  STYLEBOT_HOST_IDS.includes(el.id);

type Stylesheet = {
  css: string;
  // One constructed sheet shared by every root; absent on the <style> fallback.
  sheet?: CSSStyleSheet;
};

type Registry = {
  roots: Set<ShadowRoot>;
  stylesheets: Map<string, Stylesheet>;
  constructable: boolean;
  observer: MutationObserver;
  // Custom elements seen without a shadow root, rechecked on a back-off.
  pendingElements: Set<Element>;
  pendingCheck: { timer: number; step: number } | null;
};

type Scannable = Element | ShadowRoot | Document;

export const SHADOW_ROOT_REGISTRY_KEY = '__stylebotShadowRoots';

/**
 * The registry lives on the window because the content and editor scripts
 * each bundle this module but share one isolated world.
 */
const getRegistryHolder = (): { [SHADOW_ROOT_REGISTRY_KEY]?: Registry } =>
  window as unknown as { [SHADOW_ROOT_REGISTRY_KEY]?: Registry };

const supportsConstructableStylesheets = (): boolean =>
  typeof CSSStyleSheet !== 'undefined' &&
  typeof CSSStyleSheet.prototype.replaceSync === 'function' &&
  typeof ShadowRoot !== 'undefined' &&
  'adoptedStyleSheets' in ShadowRoot.prototype;

const applyToRoot = (
  root: ShadowRoot,
  id: string,
  stylesheet: Stylesheet
): void => {
  if (stylesheet.sheet) {
    if (!root.adoptedStyleSheets.includes(stylesheet.sheet)) {
      root.adoptedStyleSheets = [...root.adoptedStyleSheets, stylesheet.sheet];
    }
    return;
  }

  const stylesheetId = getStylesheetId(id);
  const existing = root.getElementById(stylesheetId);

  if (existing) {
    existing.textContent = stylesheet.css;
    return;
  }

  const style = document.createElement('style');
  style.setAttribute('id', stylesheetId);
  style.textContent = stylesheet.css;
  root.appendChild(style);
};

const registerRoot = (registry: Registry, root: ShadowRoot): void => {
  if (registry.roots.has(root)) {
    return;
  }

  registry.roots.add(root);
  registry.observer.observe(root, { childList: true, subtree: true });

  registry.stylesheets.forEach((stylesheet, id) => {
    applyToRoot(root, id, stylesheet);
  });

  scanSubtree(registry, root);
};

const PENDING_CHECK_DELAYS_MS = [250, 500, 1000, 2000, 4000, 8000];

/**
 * Rechecks custom elements that had no shadow root yet, since a content
 * script has no `customElements` to wait on for their upgrade.
 */
const checkPendingElements = (registry: Registry): void => {
  registry.pendingElements.forEach(el => {
    if (el.shadowRoot) {
      registry.pendingElements.delete(el);
      registerRoot(registry, el.shadowRoot);
    } else if (!el.isConnected) {
      registry.pendingElements.delete(el);
    }
  });

  const check = registry.pendingCheck;

  if (!check) {
    return;
  }

  check.step += 1;

  if (
    registry.pendingElements.size === 0 ||
    check.step >= PENDING_CHECK_DELAYS_MS.length
  ) {
    registry.pendingElements.clear();
    registry.pendingCheck = null;
    return;
  }

  check.timer = window.setTimeout(
    () => checkPendingElements(registry),
    PENDING_CHECK_DELAYS_MS[check.step]
  );
};

const watchPendingElement = (registry: Registry, el: Element): void => {
  registry.pendingElements.add(el);

  // Already due at the shortest delay; restarting it would let a page that
  // keeps adding elements postpone the check indefinitely.
  if (registry.pendingCheck?.step === 0) {
    return;
  }

  if (registry.pendingCheck) {
    window.clearTimeout(registry.pendingCheck.timer);
  }

  registry.pendingCheck = {
    step: 0,
    timer: window.setTimeout(
      () => checkPendingElements(registry),
      PENDING_CHECK_DELAYS_MS[0]
    ),
  };
};

const visitElement = (registry: Registry, el: Element): void => {
  if (isStylebotHost(el)) {
    return;
  }

  if (el.shadowRoot) {
    registerRoot(registry, el.shadowRoot);
  } else if (el.localName.includes('-')) {
    watchPendingElement(registry, el);
  }
};

// querySelectorAll never crosses into shadow trees, so this covers one
// tree; registerRoot scans each newly found root itself.
const scanSubtree = (
  registry: Registry,
  scope: Scannable,
  seen?: Set<Node>
): void => {
  if (scope instanceof Element) {
    visitElement(registry, scope);
  }

  const descendants = scope.querySelectorAll('*');

  for (let i = 0; i < descendants.length; i++) {
    visitElement(registry, descendants[i]);
    seen?.add(descendants[i]);
  }
};

const onMutations = (registry: Registry, records: Array<MutationRecord>) => {
  // Parser-inserted nodes arrive parent-first; scanning a parent's subtree
  // already covers the children that follow it in the same batch.
  const seen = new Set<Node>();

  records.forEach(record => {
    record.addedNodes.forEach(node => {
      if (node instanceof Element && !seen.has(node)) {
        scanSubtree(registry, node, seen);
      }
    });
  });
};

const createRegistry = (): Registry => {
  const registry: Registry = {
    roots: new Set(),
    stylesheets: new Map(),
    constructable: supportsConstructableStylesheets(),
    observer: new MutationObserver(records => onMutations(registry, records)),
    pendingElements: new Set(),
    pendingCheck: null,
  };

  registry.observer.observe(document, { childList: true, subtree: true });
  scanSubtree(registry, document);

  // Catches roots attached to plain elements by scripts during load, which
  // the mutation observer can't see.
  if (document.readyState !== 'complete') {
    window.addEventListener('load', () => scanSubtree(registry, document), {
      once: true,
    });
  }

  return registry;
};

const getRegistry = (): Registry => {
  const holder = getRegistryHolder();
  const registry = holder[SHADOW_ROOT_REGISTRY_KEY] ?? createRegistry();

  holder[SHADOW_ROOT_REGISTRY_KEY] = registry;

  return registry;
};

const createStylesheet = (registry: Registry, css: string): Stylesheet => {
  if (!registry.constructable) {
    return { css };
  }

  try {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(css);
    return { css, sheet };
  } catch {
    return { css };
  }
};

/**
 * Sets the CSS for a stylesheet id in every open shadow root, now and as
 * roots appear later. An empty string clears it, mirroring how the
 * document-level <style> is emptied rather than removed.
 */
export const setShadowRootCSS = (id: string, css: string): void => {
  const registry = getRegistry();
  const existing = registry.stylesheets.get(id);

  if (!existing) {
    const stylesheet = createStylesheet(registry, css);

    registry.stylesheets.set(id, stylesheet);
    registry.roots.forEach(root => applyToRoot(root, id, stylesheet));
    return;
  }

  if (existing.css === css) {
    return;
  }

  existing.css = css;

  if (existing.sheet) {
    existing.sheet.replaceSync(css);
    return;
  }

  registry.roots.forEach(root => applyToRoot(root, id, existing));
};

/**
 * Every open shadow root found on the page so far, for features that query
 * the DOM with a selector and would otherwise miss shadow-tree matches.
 */
export const getOpenShadowRoots = (): Array<ShadowRoot> => {
  return Array.from(getRegistry().roots);
};

/**
 * Every element a selector matches on the page and in its open shadow roots,
 * the places Stylebot's CSS reaches. Throws on a selector that can't parse,
 * as querySelectorAll does.
 */
export const queryWithShadowRoots = <E extends Element = Element>(
  selector: string
): Array<E> =>
  [document, ...getOpenShadowRoots()].flatMap(scope =>
    Array.from(scope.querySelectorAll<E>(selector))
  );
