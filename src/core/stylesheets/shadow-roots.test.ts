/* eslint-disable @typescript-eslint/no-explicit-any */
import type * as ShadowRoots from './shadow-roots';

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

const attachHost = (
  parent: ParentNode = document.body,
  html = '<table><tr><td>cell</td></tr></table>',
  tag = 'div'
): { host: HTMLElement; root: ShadowRoot } => {
  const host = document.createElement(tag);
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = html;
  parent.appendChild(host);

  return { host, root };
};

const styleIn = (root: ShadowRoot, id = 'example') =>
  root.getElementById(`stylebot-css-${id}`);

// jsdom has neither; this stands in for the browser's constructable
// stylesheets so the adoptedStyleSheets path can be exercised too.
const polyfillConstructableStylesheets = () => {
  (CSSStyleSheet.prototype as any).replaceSync = function (css: string) {
    this.__css = css;
  };

  const sheets = new WeakMap<ShadowRoot, Array<CSSStyleSheet>>();
  Object.defineProperty(ShadowRoot.prototype, 'adoptedStyleSheets', {
    configurable: true,
    get() {
      return sheets.get(this) ?? [];
    },
    set(value: Array<CSSStyleSheet>) {
      sheets.set(this, [...value]);
    },
  });

  return () => {
    delete (CSSStyleSheet.prototype as any).replaceSync;
    delete (ShadowRoot.prototype as any).adoptedStyleSheets;
  };
};

let setShadowRootCSS: typeof ShadowRoots.setShadowRootCSS;
let getOpenShadowRoots: typeof ShadowRoots.getOpenShadowRoots;
let SHADOW_ROOT_REGISTRY_KEY: typeof ShadowRoots.SHADOW_ROOT_REGISTRY_KEY;

const loadModule = () => {
  ({
    setShadowRootCSS,
    getOpenShadowRoots,
    SHADOW_ROOT_REGISTRY_KEY,
  } = require('./shadow-roots'));
};

const resetRegistry = () => {
  const registry = (window as any)[SHADOW_ROOT_REGISTRY_KEY];
  registry?.observer.disconnect();
  delete (window as any)[SHADOW_ROOT_REGISTRY_KEY];
};

describe('shadow-roots', () => {
  beforeEach(() => {
    jest.resetModules();
    loadModule();
  });

  afterEach(() => {
    resetRegistry();
    document.body.innerHTML = '';
  });

  describe('with the <style> fallback', () => {
    it('adds the css to shadow roots already on the page', () => {
      const { root } = attachHost();

      setShadowRootCSS('example', 'tr { color: red; }');

      expect(styleIn(root)?.textContent).toBe('tr { color: red; }');
    });

    it('adds the css to shadow roots attached later', async () => {
      setShadowRootCSS('example', 'tr { color: red; }');

      const wrapper = document.createElement('section');
      document.body.appendChild(wrapper);
      const { root } = attachHost(wrapper);
      await flush();

      expect(styleIn(root)?.textContent).toBe('tr { color: red; }');
    });

    it('reaches shadow roots nested inside other shadow roots', async () => {
      setShadowRootCSS('example', 'tr { color: red; }');

      const outer = attachHost();
      await flush();
      const inner = attachHost(outer.root);
      await flush();

      expect(styleIn(outer.root)).not.toBeNull();
      expect(styleIn(inner.root)?.textContent).toBe('tr { color: red; }');
    });

    it('updates the css in place, and an empty string clears it', () => {
      const { root } = attachHost();

      setShadowRootCSS('example', 'tr { color: red; }');
      setShadowRootCSS('example', 'tr { color: blue; }');

      expect(root.querySelectorAll('style')).toHaveLength(1);
      expect(styleIn(root)?.textContent).toBe('tr { color: blue; }');

      setShadowRootCSS('example', '');

      expect(styleIn(root)?.textContent).toBe('');
    });

    it('keeps one element per stylesheet id', () => {
      const { root } = attachHost();

      setShadowRootCSS('a', 'tr { color: red; }');
      setShadowRootCSS('b', 'td { color: blue; }');

      expect(styleIn(root, 'a')?.textContent).toBe('tr { color: red; }');
      expect(styleIn(root, 'b')?.textContent).toBe('td { color: blue; }');
    });

    it("leaves Stylebot's own editor and reader roots alone", async () => {
      setShadowRootCSS('example', '* { color: red; }');

      const editor = attachHost(document.body, '<div class="stylebot-app">');
      editor.host.id = 'stylebot';
      const reader = attachHost(document.body, '<div class="stylebot-reader">');
      reader.host.id = 'stylebot-reader';
      await flush();

      expect(styleIn(editor.root)).toBeNull();
      expect(styleIn(reader.root)).toBeNull();
      expect(getOpenShadowRoots()).toEqual([]);
    });

    it('picks up a custom element upgraded after it was parsed', async () => {
      jest.useFakeTimers();
      // A content script's isolated world has no customElements registry.
      const registry = window.customElements;
      Object.defineProperty(window, 'customElements', {
        configurable: true,
        value: null,
      });

      try {
        setShadowRootCSS('example', 'tr { color: red; }');

        const el = document.createElement('late-table');
        document.body.appendChild(el);
        await Promise.resolve();

        expect(el.shadowRoot).toBeNull();

        el.attachShadow({ mode: 'open' }).innerHTML = '<table></table>';
        jest.advanceTimersByTime(250);

        expect(styleIn(el.shadowRoot as ShadowRoot)?.textContent).toBe(
          'tr { color: red; }'
        );
      } finally {
        Object.defineProperty(window, 'customElements', {
          configurable: true,
          value: registry,
        });
        jest.useRealTimers();
      }
    });

    it('stops rechecking custom elements that never get a shadow root', async () => {
      jest.useFakeTimers();

      try {
        setShadowRootCSS('example', 'tr { color: red; }');
        document.body.appendChild(document.createElement('light-only'));
        await Promise.resolve();
        expect(jest.getTimerCount()).toBe(1);

        jest.advanceTimersByTime(60_000);

        expect(jest.getTimerCount()).toBe(0);
      } finally {
        jest.useRealTimers();
      }
    });
  });

  describe('with constructable stylesheets', () => {
    let restore: () => void;

    beforeEach(() => {
      restore = polyfillConstructableStylesheets();
    });

    afterEach(() => {
      restore();
    });

    it('adopts one shared sheet per stylesheet id instead of a <style>', async () => {
      const first = attachHost();

      setShadowRootCSS('example', 'tr { color: red; }');

      const second = attachHost();
      await flush();

      expect(first.root.adoptedStyleSheets).toHaveLength(1);
      expect(second.root.adoptedStyleSheets[0]).toBe(
        first.root.adoptedStyleSheets[0]
      );
      expect((first.root.adoptedStyleSheets[0] as any).__css).toBe(
        'tr { color: red; }'
      );
      expect(styleIn(first.root)).toBeNull();
    });

    it("keeps the page's own adopted sheets ahead of ours", () => {
      const { root } = attachHost();
      const pageSheet = new CSSStyleSheet();
      root.adoptedStyleSheets = [pageSheet];

      setShadowRootCSS('example', 'tr { color: red; }');

      expect(root.adoptedStyleSheets[0]).toBe(pageSheet);
      expect(root.adoptedStyleSheets).toHaveLength(2);
    });

    it('updates the shared sheet in place, and an empty string clears it', () => {
      const { root } = attachHost();

      setShadowRootCSS('example', 'tr { color: red; }');
      const sheet = root.adoptedStyleSheets[0] as any;

      setShadowRootCSS('example', 'tr { color: blue; }');
      expect(sheet.__css).toBe('tr { color: blue; }');
      expect(root.adoptedStyleSheets).toHaveLength(1);

      setShadowRootCSS('example', '');
      expect(sheet.__css).toBe('');
    });

    it('shares its registry with another copy of the module in the same window', () => {
      const { root } = attachHost();
      setShadowRootCSS('example', 'tr { color: red; }');

      // The editor content script bundles its own copy of this module.
      jest.resetModules();
      loadModule();

      setShadowRootCSS('example', 'tr { color: blue; }');

      expect(root.adoptedStyleSheets).toHaveLength(1);
      expect((root.adoptedStyleSheets[0] as any).__css).toBe(
        'tr { color: blue; }'
      );
    });
  });

  describe('getOpenShadowRoots', () => {
    it('lists every open root found so far, on demand', async () => {
      const first = attachHost();

      expect(getOpenShadowRoots()).toEqual([first.root]);

      const second = attachHost();
      await flush();

      expect(getOpenShadowRoots()).toEqual([first.root, second.root]);
    });
  });
});
