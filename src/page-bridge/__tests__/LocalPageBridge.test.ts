import * as stylebotCss from '@stylebot/css';
import { injectStylesheet } from '@stylebot/inject-css';
import * as stylebotReadability from '@stylebot/readability';
import { readCache, writeCache } from '../../inject-css/cache';

import { LocalPageBridge } from '../LocalPageBridge';

jest.mock('@stylebot/css');
jest.mock('@stylebot/inject-css', () => ({
  ...jest.requireActual('@stylebot/inject-css'),
  injectStylesheet: jest.fn(),
}));
jest.mock('@stylebot/readability');

const mockHighlighter = {
  startInspecting: jest.fn(),
  stopInspecting: jest.fn(),
  highlight: jest.fn(),
  unhighlight: jest.fn(),
};

jest.mock('@stylebot/highlighter', () => ({
  Highlighter: jest.fn().mockImplementation(() => mockHighlighter),
}));

const url = 'example.com';

describe('LocalPageBridge', () => {
  let bridge: LocalPageBridge;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    bridge = new LocalPageBridge({ getStylebotCss: () => '' });
  });

  describe('applyCss', () => {
    const css = 'a { color: red; }';
    const compiled = { css: 'a { color: red !important; }', importUrls: [] };

    beforeEach(() => {
      jest.spyOn(stylebotCss, 'removeEmptyRules').mockReturnValue(css);
      jest.spyOn(stylebotCss, 'compileStyle').mockReturnValue(compiled);
    });

    it('injects the style compiled with !important forced', () => {
      bridge.applyCss({ url, css, enabled: true, forceImportant: true });

      expect(stylebotCss.compileStyle).toBeCalledWith(css, {
        forceImportant: true,
      });
      expect(injectStylesheet).toBeCalledWith(url, compiled.css, []);
    });

    it('compiles a style with Override site styles off without forcing it', () => {
      bridge.applyCss({ url, css, enabled: true, forceImportant: false });

      expect(stylebotCss.compileStyle).toBeCalledWith(css, {
        forceImportant: false,
      });
    });

    it('compiles each edit only once', () => {
      writeCache({ styles: [], readability: false });

      bridge.applyCss({ url, css, enabled: true, forceImportant: true });

      expect(stylebotCss.compileStyle).toHaveBeenCalledTimes(1);
    });

    it('does nothing to the cache when nothing is cached yet', () => {
      bridge.applyCss({ url, css, enabled: true, forceImportant: true });

      expect(readCache()).toBeNull();
    });

    it('updates the matching cached style in place', () => {
      writeCache({
        styles: [
          { url, css: 'a { color: blue; }', importUrls: [], enabled: true },
          {
            url: 'other.example.com',
            css: 'b { color: green; }',
            importUrls: [],
            enabled: true,
          },
        ],
        readability: false,
      });

      bridge.applyCss({ url, css, enabled: true, forceImportant: true });

      expect(stylebotCss.compileStyle).toBeCalledWith(css, {
        forceImportant: true,
      });
      expect(readCache()).toEqual({
        styles: [
          { url, ...compiled, enabled: true },
          {
            url: 'other.example.com',
            css: 'b { color: green; }',
            importUrls: [],
            enabled: true,
          },
        ],
        readability: false,
      });
    });

    it('leaves the page and the cached style alone while the css does not parse', () => {
      const cachedState = {
        styles: [
          { url, css: 'a { color: blue; }', importUrls: [], enabled: true },
        ],
        readability: false,
      };
      writeCache(cachedState);
      jest.spyOn(stylebotCss, 'compileStyle').mockImplementation(() => {
        throw new Error('Unclosed block');
      });

      bridge.applyCss({ url, css: 'a {', enabled: true, forceImportant: true });

      expect(readCache()).toEqual(cachedState);
      expect(injectStylesheet).not.toBeCalled();
    });

    it('appends a cached style if none exists yet for this url', () => {
      writeCache({
        styles: [
          {
            url: 'other.example.com',
            css: 'b { color: green; }',
            importUrls: [],
            enabled: true,
          },
        ],
        readability: false,
      });

      bridge.applyCss({ url, css, enabled: true, forceImportant: true });

      expect(readCache()).toEqual({
        styles: [
          {
            url: 'other.example.com',
            css: 'b { color: green; }',
            importUrls: [],
            enabled: true,
          },
          { url, ...compiled, enabled: true },
        ],
        readability: false,
      });
    });
  });

  describe('setPreviewCss', () => {
    it('injects a scratch stylesheet, forced like the style it previews', () => {
      bridge.setPreviewCss({
        css: 'h1 { font-family: Inter; }',
        forceImportant: true,
      });
      bridge.setPreviewCss({
        css: 'h1 { font-family: Lora; }',
        forceImportant: false,
      });

      expect(stylebotCss.injectCSSIntoDocument).toBeCalledWith(
        'h1 { font-family: Inter; }',
        'font-preview',
        { forceImportant: true }
      );
      expect(stylebotCss.injectCSSIntoDocument).toBeCalledWith(
        'h1 { font-family: Lora; }',
        'font-preview',
        { forceImportant: false }
      );
    });

    it('removes it for null', () => {
      bridge.setPreviewCss(null);

      expect(stylebotCss.removeCSSFromDocument).toBeCalledWith('font-preview');
      expect(stylebotCss.injectCSSIntoDocument).not.toBeCalled();
    });
  });

  describe('applyReadability', () => {
    it('applies the reader', () => {
      bridge.applyReadability(true);

      expect(stylebotReadability.applyReadability).toBeCalledWith(true);
    });

    it('removes it when turned off', () => {
      bridge.applyReadability(false);

      expect(stylebotReadability.removeReadability).toBeCalled();
    });

    it('does nothing to the cache when nothing is cached yet', () => {
      bridge.applyReadability(true);

      expect(readCache()).toBeNull();
    });

    it('updates the cached readability flag in place', () => {
      writeCache({
        styles: [
          { url, css: 'a { color: blue; }', importUrls: [], enabled: true },
        ],
        readability: false,
      });

      bridge.applyReadability(true);

      expect(readCache()).toEqual({
        styles: [
          { url, css: 'a { color: blue; }', importUrls: [], enabled: true },
        ],
        readability: true,
      });
    });
  });

  describe('highlight', () => {
    it('previews a valid selector', () => {
      jest.spyOn(stylebotCss, 'validateSelector').mockReturnValue(true);

      bridge.highlight('a');

      expect(mockHighlighter.highlight).toBeCalledWith('a');
    });

    it('clears the preview for an invalid selector', () => {
      jest.spyOn(stylebotCss, 'validateSelector').mockReturnValue(false);

      bridge.highlight('a[');

      expect(mockHighlighter.highlight).not.toBeCalled();
      expect(mockHighlighter.unhighlight).toBeCalled();
    });
  });

  describe('getSnapshot', () => {
    it('reads the page facts the editor mirrors', async () => {
      jest.spyOn(stylebotReadability, 'isReaderable').mockReturnValue(true);
      jest
        .spyOn(stylebotCss, 'getBodyChildSelectors')
        .mockReturnValue(['div.a']);
      document.title = 'Title';

      await expect(bridge.getSnapshot()).resolves.toEqual({
        domain: document.domain,
        href: window.location.href,
        title: 'Title',
        readerable: true,
        bodyChildSelectors: ['div.a'],
      });
    });
  });

  describe('select', () => {
    it('forwards the inspector selection to listeners', () => {
      const { Highlighter } = jest.requireMock('@stylebot/highlighter');
      const onSelect = Highlighter.mock.calls[0][0].onSelect;
      const listener = jest.fn();
      const off = bridge.on('select', listener);

      onSelect('h1');
      expect(listener).toBeCalledWith('h1');

      off();
      onSelect('h2');
      expect(listener).toBeCalledTimes(1);
    });
  });
});
