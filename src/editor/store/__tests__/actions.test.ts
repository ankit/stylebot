import * as postcss from 'postcss';
import actions from '../actions';

import mockState from '../__mocks__/state';
import * as stylebotCss from '@stylebot/css';
import * as stylebotReadability from '@stylebot/readability';
import * as googleFonts from '@stylebot/google-fonts';
import * as chromeUtils from '../../utils/chrome';
import { readCache, writeCache } from '../../../inject-css/cache';

jest.mock('postcss');
jest.mock('@stylebot/css');
jest.mock('@stylebot/readability');
jest.mock('@stylebot/google-fonts');
jest.mock('../../utils/chrome');

const mockRoot = {
  some: jest.fn(),
  walkRules: jest.fn(),
  append: jest.fn(),
  toString: jest.fn(),
} as never as postcss.Root;

const mockCommit = jest.fn();
const mockDispatch = jest.fn();

describe('actions', () => {
  beforeAll(() => {
    jest.spyOn(stylebotCss, 'injectRootIntoDocument');
    jest.spyOn(chromeUtils, 'setStyle');
  });

  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(postcss, 'parse').mockReturnValue(mockRoot);
  });

  describe('applyCss', () => {
    it('does not commit invalid css', () => {
      jest.spyOn(postcss, 'parse').mockImplementation(() => {
        throw new Error();
      });

      try {
        actions.applyCss(
          { commit: mockCommit, state: mockState },
          { css: 'invalid' }
        );
      } catch (e) {
        expect(mockCommit).toBeCalledTimes(0);
        expect(chromeUtils.setStyle).toBeCalledTimes(0);
        expect(stylebotCss.injectRootIntoDocument).toBeCalledTimes(0);
      }
    });

    it('invokes setStyle correctly', () => {
      const css = 'a { color: red; }';
      jest.spyOn(stylebotCss, 'removeEmptyRules').mockReturnValue(css);

      actions.applyCss({ commit: mockCommit, state: mockState }, { css });

      expect(mockCommit).toHaveBeenNthCalledWith(1, 'setCss', css);
      expect(mockCommit).toHaveBeenNthCalledWith(2, 'setSelectors', mockRoot);

      expect(stylebotCss.injectRootIntoDocument).toBeCalledWith(
        mockRoot,
        mockState.url
      );

      expect(stylebotCss.removeEmptyRules).toBeCalledWith(css);
      expect(chromeUtils.setStyle).toBeCalledWith(
        mockState.url,
        css,
        mockState.readability
      );
    });

    afterEach(() => {
      localStorage.clear();
    });

    it('does nothing to the cache when nothing is cached yet', () => {
      const css = 'a { color: red; }';
      jest.spyOn(stylebotCss, 'removeEmptyRules').mockReturnValue(css);

      actions.applyCss({ commit: mockCommit, state: mockState }, { css });

      expect(readCache()).toBeNull();
    });

    it('updates the matching cached style in place', () => {
      const css = 'a { color: red; }';
      jest.spyOn(stylebotCss, 'removeEmptyRules').mockReturnValue(css);

      writeCache({
        styles: [
          { url: mockState.url, css: 'a { color: blue; }', enabled: true },
          {
            url: 'other.example.com',
            css: 'b { color: green; }',
            enabled: true,
          },
        ],
        readability: false,
      });

      actions.applyCss({ commit: mockCommit, state: mockState }, { css });

      expect(readCache()).toEqual({
        styles: [
          { url: mockState.url, css, enabled: mockState.enabled },
          {
            url: 'other.example.com',
            css: 'b { color: green; }',
            enabled: true,
          },
        ],
        readability: false,
      });
    });

    it('appends a cached style if none exists yet for this url', () => {
      const css = 'a { color: red; }';
      jest.spyOn(stylebotCss, 'removeEmptyRules').mockReturnValue(css);

      writeCache({
        styles: [
          {
            url: 'other.example.com',
            css: 'b { color: green; }',
            enabled: true,
          },
        ],
        readability: false,
      });

      actions.applyCss({ commit: mockCommit, state: mockState }, { css });

      expect(readCache()).toEqual({
        styles: [
          {
            url: 'other.example.com',
            css: 'b { color: green; }',
            enabled: true,
          },
          { url: mockState.url, css, enabled: mockState.enabled },
        ],
        readability: false,
      });
    });
  });

  describe('applyReadability', () => {
    afterEach(() => {
      localStorage.clear();
    });

    it('does nothing to the cache when nothing is cached yet', () => {
      actions.applyReadability({ commit: mockCommit, state: mockState }, true);

      expect(readCache()).toBeNull();
    });

    it('updates the cached readability flag in place', () => {
      writeCache({
        styles: [
          { url: mockState.url, css: 'a { color: blue; }', enabled: true },
        ],
        readability: false,
      });

      actions.applyReadability({ commit: mockCommit, state: mockState }, true);

      expect(readCache()).toEqual({
        styles: [
          { url: mockState.url, css: 'a { color: blue; }', enabled: true },
        ],
        readability: true,
      });
      expect(stylebotReadability.applyReadability).toBeCalledWith(true);
      expect(chromeUtils.setReadability).toBeCalledWith(mockState.url, true);
    });

    it('switches out of basic/code mode since editing page CSS has no effect there, without persisting the mode change', () => {
      actions.applyReadability({ commit: mockCommit, state: mockState }, true);

      expect(mockCommit).toBeCalledWith('setOptions', {
        ...mockState.options,
        mode: 'magic',
      });
      expect(chromeUtils.setOption).not.toBeCalledWith('mode', 'magic');
    });

    it('leaves the mode alone when turning readability off', () => {
      actions.applyReadability({ commit: mockCommit, state: mockState }, false);

      expect(mockCommit).not.toBeCalledWith(
        'setOptions',
        expect.objectContaining({ mode: 'magic' })
      );
    });

    it('leaves the mode alone when already in magic mode', () => {
      actions.applyReadability(
        {
          commit: mockCommit,
          state: {
            ...mockState,
            options: { ...mockState.options, mode: 'magic' },
          },
        },
        true
      );

      expect(mockCommit).not.toBeCalledWith(
        'setOptions',
        expect.objectContaining({ mode: 'magic' })
      );
    });
  });

  describe('applyDeclaration', () => {
    it('no-op if no selector is active', () => {
      actions.applyDeclaration(
        { state: mockState, dispatch: mockDispatch },
        {
          property: 'color',
          value: 'red',
        }
      );

      expect(stylebotCss.addDeclaration).toBeCalledTimes(0);
      expect(mockDispatch).toBeCalledTimes(0);
    });

    it('invokes addDeclaration correctly', () => {
      const state = { ...mockState, activeSelector: 'a' };

      jest
        .spyOn(stylebotCss, 'addDeclaration')
        .mockReturnValue('outputOfAddDeclaration');

      actions.applyDeclaration(
        {
          state,
          dispatch: mockDispatch,
        },
        {
          property: 'color',
          value: 'red',
        }
      );

      expect(stylebotCss.addDeclaration).toBeCalledWith(
        'color',
        'red',
        'a',
        ''
      );

      expect(mockDispatch).toBeCalledWith('applyCss', {
        css: 'outputOfAddDeclaration',
      });
    });
  });

  describe('escape', () => {
    it('closes the help dialog instead of Stylebot when it is open', () => {
      const state = { ...mockState, help: true };

      actions.escape({ state, commit: mockCommit, dispatch: mockDispatch });

      expect(mockCommit).toBeCalledWith('setHelp', false);
      expect(mockDispatch).not.toBeCalled();
    });

    it('closes Stylebot when the help dialog is not open', () => {
      const state = { ...mockState, help: false };

      actions.escape({ state, commit: mockCommit, dispatch: mockDispatch });

      expect(mockDispatch).toBeCalledWith('closeStylebot');
      expect(mockCommit).not.toBeCalled();
    });
  });

  describe('rememberFont', () => {
    const stateWithFonts = (fonts: Array<string>) => ({
      ...mockState,
      options: { ...mockState.options, fonts },
    });

    it('moves an already listed font to the front', () => {
      actions.rememberFont(
        {
          state: stateWithFonts(['Lora', 'Inter', 'Roboto']),
          commit: mockCommit,
        },
        'Inter'
      );

      expect(chromeUtils.setOption).toBeCalledWith('fonts', [
        'Inter',
        'Lora',
        'Roboto',
      ]);
      expect(mockCommit).toBeCalledWith(
        'setOptions',
        expect.objectContaining({ fonts: ['Inter', 'Lora', 'Roboto'] })
      );
    });

    it('prepends a new font', () => {
      actions.rememberFont(
        { state: stateWithFonts(['Lora']), commit: mockCommit },
        'Inter'
      );

      expect(chromeUtils.setOption).toBeCalledWith('fonts', ['Inter', 'Lora']);
    });

    it('keeps at most ten fonts', () => {
      const fonts = Array.from({ length: 10 }, (_, i) => `Font ${i}`);

      actions.rememberFont(
        { state: stateWithFonts(fonts), commit: mockCommit },
        'Inter'
      );

      expect(chromeUtils.setOption).toBeCalledWith('fonts', [
        'Inter',
        ...fonts.slice(0, 9),
      ]);
    });
  });

  describe('applyFontFamily', () => {
    const state = { ...mockState, activeSelector: 'a', css: 'a { }' };

    beforeEach(() => {
      jest
        .spyOn(googleFonts, 'loadGoogleFonts')
        .mockResolvedValue([{ family: 'Inter', category: 'sans-serif' }]);
      jest
        .spyOn(stylebotCss, 'getPrimaryFontFamily')
        .mockImplementation(value => value.split(',')[0].trim());
      jest
        .spyOn(stylebotCss, 'cleanGoogleWebFonts')
        .mockImplementation(css => css);
      jest
        .spyOn(stylebotCss, 'addGoogleWebFontImport')
        .mockReturnValue('withImport');
      jest.spyOn(stylebotCss, 'addGoogleWebFont').mockResolvedValue('checked');
    });

    it('applies the declaration before adding a bundled font import', async () => {
      await actions.applyFontFamily(
        { state, dispatch: mockDispatch },
        'Inter, sans-serif'
      );

      expect(mockDispatch).toHaveBeenNthCalledWith(1, 'applyDeclaration', {
        property: 'font-family',
        value: 'Inter, sans-serif',
      });
      expect(mockDispatch).toHaveBeenNthCalledWith(2, 'rememberFont', 'Inter');
      expect(stylebotCss.addGoogleWebFontImport).toBeCalledWith(
        'Inter',
        'a { }'
      );
      expect(stylebotCss.addGoogleWebFont).not.toBeCalled();
      expect(mockDispatch).toHaveBeenNthCalledWith(3, 'applyCss', {
        css: 'withImport',
      });
    });

    it('checks fonts outside the bundled list before importing', async () => {
      await actions.applyFontFamily(
        { state, dispatch: mockDispatch },
        'Some Local'
      );

      expect(stylebotCss.addGoogleWebFont).toBeCalledWith(
        'Some Local',
        'a { }'
      );
      expect(stylebotCss.addGoogleWebFontImport).not.toBeCalled();
      expect(mockDispatch).toBeCalledWith('applyCss', { css: 'checked' });
    });

    it('clears the font without remembering or importing anything', async () => {
      await actions.applyFontFamily({ state, dispatch: mockDispatch }, '');

      expect(mockDispatch).not.toBeCalledWith(
        'rememberFont',
        expect.anything()
      );
      expect(mockDispatch).toBeCalledWith('applyDeclaration', {
        property: 'font-family',
        value: '',
      });
      expect(stylebotCss.addGoogleWebFont).not.toBeCalled();
      expect(stylebotCss.addGoogleWebFontImport).not.toBeCalled();
    });
  });

  describe('previewFontFamily', () => {
    const state = { ...mockState, activeSelector: 'h1' };

    beforeEach(() => {
      jest
        .spyOn(googleFonts, 'loadGoogleFonts')
        .mockResolvedValue([{ family: 'Inter', category: 'sans-serif' }]);
      jest
        .spyOn(stylebotCss, 'getPrimaryFontFamily')
        .mockImplementation(value => value.split(',')[0].trim());
      jest
        .spyOn(stylebotCss, 'addGoogleWebFontImport')
        .mockImplementation((_family, css) => `@import;\n${css}`);
    });

    it('no-ops without an active selector', async () => {
      await actions.previewFontFamily({ state: mockState }, 'Inter');

      expect(stylebotCss.injectRootIntoDocument).not.toBeCalled();
    });

    it('injects a preview stylesheet with the import for a bundled font', async () => {
      await actions.previewFontFamily({ state }, 'Inter, sans-serif');

      expect(postcss.parse).toBeCalledWith(
        '@import;\nh1 { font-family: Inter, sans-serif; }'
      );
      expect(stylebotCss.injectRootIntoDocument).toBeCalledWith(
        mockRoot,
        'font-preview'
      );
    });

    it('skips the import for an unknown font', async () => {
      await actions.previewFontFamily({ state }, 'Some Local');

      expect(postcss.parse).toBeCalledWith('h1 { font-family: Some Local; }');
      expect(stylebotCss.addGoogleWebFontImport).not.toBeCalled();
    });

    it('removes the preview for an empty value', async () => {
      await actions.previewFontFamily({ state }, '');

      expect(stylebotCss.removeCSSFromDocument).toBeCalledWith('font-preview');
      expect(stylebotCss.injectRootIntoDocument).not.toBeCalled();
    });
  });
});
