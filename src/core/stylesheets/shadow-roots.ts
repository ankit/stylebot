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
  // Only while some stylesheet has CSS to mirror.
  observing: boolean;
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

// Custom elements not yet upgraded; built-in elements always count as defined.
const UNDEFINED_SELECTOR = ':not(:defined)';

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

const visitHost = (registry: Registry, el: Element): void => {
  const root = el.shadowRoot;

  if (root && !isStylebotHost(el)) {
    registerRoot(registry, root);
  }
};

/**
 * Finds the open roots in one tree and the custom elements still waiting
 * for their definition. querySelectorAll never crosses into shadow trees;
 * registerRoot scans each newly found root itself.
 */
const scanSubtree = (registry: Registry, scope: Scannable): void => {
  if (scope instanceof Element) {
    visitHost(registry, scope);

    if (scope.matches(UNDEFINED_SELECTOR) && !isStylebotHost(scope)) {
      watchPendingElement(registry, scope);
    }
  }

  const descendants = scope.querySelectorAll('*');

  for (let i = 0; i < descendants.length; i++) {
    visitHost(registry, descendants[i]);
  }

  // Matched natively, so elements that can't upgrade are never touched
  const undefinedElements = scope.querySelectorAll(UNDEFINED_SELECTOR);

  for (let i = 0; i < undefinedElements.length; i++) {
    if (!isStylebotHost(undefinedElements[i])) {
      watchPendingElement(registry, undefinedElements[i]);
    }
  }
};

const onMutations = (registry: Registry, records: Array<MutationRecord>) => {
  const added = new Set<Node>();

  records.forEach(record => record.addedNodes.forEach(node => added.add(node)));

  records.forEach(record => {
    // A node added inside another node added in this batch is covered by
    // that node's scan, as is every parser-inserted child after its parent.
    if (added.has(record.target)) {
      return;
    }

    record.addedNodes.forEach(node => {
      if (node instanceof Element) {
        scanSubtree(registry, node);
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
    observing: false,
    pendingElements: new Set(),
    pendingCheck: null,
  };

  return registry;
};

const startObserving = (registry: Registry): void => {
  if (registry.observing) {
    return;
  }

  registry.observing = true;
  registry.observer.observe(document, { childList: true, subtree: true });
  scanSubtree(registry, document);

  // Catches roots attached to plain elements by scripts during load, which
  // the mutation observer can't see.
  if (document.readyState !== 'complete') {
    window.addEventListener(
      'load',
      () => {
        if (registry.observing) {
          scanSubtree(registry, document);
        }
      },
      { once: true }
    );
  }
};

/**
 * Stops watching the page once no stylesheet has CSS left to mirror. Roots
 * keep their emptied sheets, and are found again if a style comes back.
 */
const stopObserving = (registry: Registry): void => {
  if (!registry.observing) {
    return;
  }

  registry.observing = false;
  registry.observer.disconnect();
  registry.roots.clear();
  registry.pendingElements.clear();

  if (registry.pendingCheck) {
    window.clearTimeout(registry.pendingCheck.timer);
    registry.pendingCheck = null;
  }
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

const updateStylesheet = (registry: Registry, id: string, css: string) => {
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
 * Sets the CSS for a stylesheet id in every open shadow root, now and as
 * roots appear later. An empty string clears it, mirroring how the
 * document-level <style> is emptied rather than removed. The page is only
 * watched while some stylesheet has CSS.
 */
export const setShadowRootCSS = (id: string, css: string): void => {
  const holder = getRegistryHolder();

  if (!css && !holder[SHADOW_ROOT_REGISTRY_KEY]) {
    return;
  }

  const registry = getRegistry();

  updateStylesheet(registry, id, css);

  const hasCSS = Array.from(registry.stylesheets.values()).some(
    stylesheet => stylesheet.css
  );

  if (hasCSS) {
    startObserving(registry);
  } else {
    stopObserving(registry);
  }
};

let rootsSnapshot: Array<ShadowRoot> | null = null;

/**
 * Finds every open root on the page from scratch, for queries made while
 * no style is watching the page. Kept until the current task's microtasks
 * run, so a burst of queries scans once.
 */
const snapshotOpenShadowRoots = (): Array<ShadowRoot> => {
  if (rootsSnapshot) {
    return rootsSnapshot;
  }

  const roots: Array<ShadowRoot> = [];
  const scopes: Array<Document | ShadowRoot> = [document];

  while (scopes.length > 0) {
    const descendants = (
      scopes.pop() as Document | ShadowRoot
    ).querySelectorAll('*');

    for (let i = 0; i < descendants.length; i++) {
      const root = descendants[i].shadowRoot;

      if (root && !isStylebotHost(descendants[i])) {
        roots.push(root);
        scopes.push(root);
      }
    }
  }

  rootsSnapshot = roots;
  queueMicrotask(() => {
    rootsSnapshot = null;
  });

  return roots;
};

/**
 * Every open shadow root on the page, for features that query the DOM with
 * a selector and would otherwise miss shadow-tree matches.
 */
export const getOpenShadowRoots = (): Array<ShadowRoot> => {
  const registry = getRegistryHolder()[SHADOW_ROOT_REGISTRY_KEY];

  return registry?.observing
    ? Array.from(registry.roots)
    : snapshotOpenShadowRoots();
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
