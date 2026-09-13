/* eslint-disable @typescript-eslint/no-explicit-any */
import type * as InjectStyle from '../inject-style';

const stylesheetId = (id: string) => `stylebot-css-${id}`;

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

const setReadyState = (readyState: DocumentReadyState) => {
  Object.defineProperty(document, 'readyState', {
    configurable: true,
    value: readyState,
  });
};

// The module keeps a singleton MutationObserver/element list to reposition
// stylesheets while the document is parsing (see keepStylebotStylesLast).
// Re-requiring it fresh per test avoids that state leaking between tests.
let injectCSSIntoDocument: typeof InjectStyle.injectCSSIntoDocument;
let removeCSSFromDocument: typeof InjectStyle.removeCSSFromDocument;

describe('inject-style', () => {
  beforeEach(() => {
    jest.resetModules();
    ({ injectCSSIntoDocument, removeCSSFromDocument } = require('../inject-style'));
  });

  afterEach(() => {
    document
      .querySelectorAll('style[id^="stylebot-css-"]')
      .forEach(el => el.remove());
    delete (global as any).chrome;
    setReadyState('complete');
  });

  describe('injectCSSIntoDocument', () => {
    it('creates a style element with the given css', async () => {
      await injectCSSIntoDocument('a { color: red; }', 'example');

      const style = document.getElementById(stylesheetId('example'));

      expect(style?.tagName).toBe('STYLE');
      expect(style?.textContent).toContain('color: red');
    });

    it('updates an existing style element in place, rather than duplicating it', async () => {
      await injectCSSIntoDocument('a { color: red; }', 'example');
      await injectCSSIntoDocument('a { color: blue; }', 'example');

      const elements = document.querySelectorAll(
        `#${stylesheetId('example')}`
      );

      expect(elements).toHaveLength(1);
      expect(elements[0].textContent).toContain('color: blue');
    });

    it('resolves without a background round trip when there is no @import', async () => {
      (global as any).chrome = { runtime: { sendMessage: jest.fn() } };

      await injectCSSIntoDocument('a { color: red; }', 'example');

      expect(
        (global as any).chrome.runtime.sendMessage
      ).not.toHaveBeenCalled();
    });

    it('applies the rest of the css immediately, without waiting on an @import fetch', async () => {
      let deliverImport: (css: string) => void = () => undefined;

      (global as any).chrome = {
        runtime: {
          sendMessage: jest.fn(
            (_message: unknown, callback: (response: string) => void) => {
              deliverImport = callback;
            }
          ),
        },
      };

      const css = `
        @import url(https://fonts.example.com/font.css);
        a { color: red; }
      `;

      await injectCSSIntoDocument(css, 'example');

      const style = document.getElementById(stylesheetId('example'));

      expect(style?.textContent).toContain('color: red');
      expect(style?.textContent).not.toContain('@import');

      deliverImport('@font-face { font-family: "Test"; }');
      await flush();

      expect(style?.textContent).toContain('@font-face');
      expect(style?.textContent).toContain('color: red');
    });
  });

  describe('style ordering while the document is still parsing', () => {
    it('keeps the injected style as the last child of <html>, even if the page attaches a node ahead of it', async () => {
      setReadyState('loading');

      await injectCSSIntoDocument('a { color: blue !important; }', 'example');

      const style = document.getElementById(
        stylesheetId('example')
      ) as HTMLStyleElement;

      // Simulate document_start injection racing ahead of the parser: our
      // style ends up before a node the page hasn't attached yet.
      document.documentElement.insertBefore(
        style,
        document.documentElement.firstChild
      );
      expect(document.documentElement.firstChild).toBe(style);

      await flush();

      expect(document.documentElement.lastChild).toBe(style);
    });

    it('stops repositioning the style once the document has finished parsing', async () => {
      setReadyState('loading');

      await injectCSSIntoDocument('a { color: blue !important; }', 'example');

      setReadyState('complete');
      document.dispatchEvent(new Event('readystatechange'));

      const style = document.getElementById(
        stylesheetId('example')
      ) as HTMLStyleElement;
      const lateNode = document.createElement('div');

      document.documentElement.appendChild(lateNode);
      await flush();

      expect(document.documentElement.lastChild).toBe(lateNode);
      expect(document.documentElement.lastChild).not.toBe(style);
    });
  });

  describe('removeCSSFromDocument', () => {
    it('clears the stylesheet content', async () => {
      await injectCSSIntoDocument('a { color: red; }', 'example');
      removeCSSFromDocument('example');

      expect(
        document.getElementById(stylesheetId('example'))?.textContent
      ).toBe('');
    });

    it('does nothing if the stylesheet does not exist', () => {
      expect(() => removeCSSFromDocument('missing')).not.toThrow();
    });
  });
});
