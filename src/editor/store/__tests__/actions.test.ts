import * as postcss from 'postcss';
import actions from '../actions';

import mockState from '../__mocks__/state';
import * as stylebotCss from '@stylebot/css';
import * as googleFonts from '@stylebot/google-fonts';
import * as chromeUtils from '../../utils/chrome';
import * as page from '@stylebot/page-bridge';

jest.mock('postcss');
jest.mock('@stylebot/css');
jest.mock('@stylebot/google-fonts');
jest.mock('../../utils/chrome');
jest.mock('@stylebot/page-bridge');

const mockRoot = {
  some: jest.fn(),
  walkRules: jest.fn(),
  append: jest.fn(),
  toString: jest.fn(),
} as never as postcss.Root;

const mockCommit = jest.fn();
const mockDispatch = jest.fn();

const mockBridge = {
  getSnapshot: jest.fn(),
  applyCss: jest.fn(),
  setPreviewCss: jest.fn(),
  applyReadability: jest.fn(),
  startInspecting: jest.fn(),
  stopInspecting: jest.fn(),
  highlight: jest.fn(),
  unhighlight: jest.fn(),
  getPageColors: jest.fn(),
  openInPage: jest.fn(),
  focusPage: jest.fn(),
  on: jest.fn(),
} as jest.Mocked<page.PageBridge>;

describe('actions', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(postcss, 'parse').mockReturnValue(mockRoot);
    jest.spyOn(page, 'getPageBridge').mockReturnValue(mockBridge);
  });

  describe('applyCss', () => {
    it('does not commit invalid css', () => {
      jest.spyOn(postcss, 'parse').mockImplementation(() => {
        throw new Error();
      });

      actions.applyCss(
        { commit: mockCommit, state: mockState },
        { css: 'invalid' }
      );

      expect(mockCommit).toBeCalledTimes(0);
      expect(mockBridge.applyCss).toBeCalledTimes(0);
      expect(chromeUtils.setStyle).toBeCalledTimes(0);
    });

    it('applies to the page, persists the cleaned css and commits it', () => {
      const css = 'a { color: red; }';
      jest.spyOn(stylebotCss, 'removeEmptyRules').mockReturnValue('clean');

      actions.applyCss({ commit: mockCommit, state: mockState }, { css });

      expect(mockBridge.applyCss).toBeCalledWith({
        url: mockState.url,
        css,
        enabled: mockState.enabled,
        forceImportant: true,
      });
      expect(chromeUtils.setStyle).toBeCalledWith(
        mockState.url,
        'clean',
        mockState.readability,
        true
      );
      expect(mockCommit).toHaveBeenNthCalledWith(1, 'setCss', css);
      expect(mockCommit).toHaveBeenNthCalledWith(2, 'setSelectors', mockRoot);
    });

    it('does not save an empty style when none was loaded, since that would delete it', () => {
      actions.applyCss({ commit: mockCommit, state: mockState }, { css: '' });

      expect(chromeUtils.setStyle).toBeCalledTimes(0);
      expect(mockBridge.applyCss).toBeCalledTimes(0);
      expect(mockCommit).toBeCalledTimes(0);
    });

    it('still clears a style the editor was showing', () => {
      const state = { ...mockState, css: 'a { color: red; }' };
      jest.spyOn(stylebotCss, 'removeEmptyRules').mockReturnValue('');

      actions.applyCss({ commit: mockCommit, state }, { css: '' });

      expect(chromeUtils.setStyle).toBeCalledWith(state.url, '', false, true);
    });

    it('applies and persists a style with Override site styles off', () => {
      const state = { ...mockState, forceImportant: false };
      jest.spyOn(stylebotCss, 'removeEmptyRules').mockReturnValue('clean');

      actions.applyCss({ commit: mockCommit, state }, { css: 'a {}' });

      expect(mockBridge.applyCss).toBeCalledWith(
        expect.objectContaining({ forceImportant: false })
      );
      expect(chromeUtils.setStyle).toBeCalledWith(
        state.url,
        'clean',
        state.readability,
        false
      );
    });
  });

  describe('setForceImportant', () => {
    it('commits the setting and reapplies the current css with it', () => {
      const state = { ...mockState, css: 'a { color: red; }' };
      const dispatch = jest.fn();

      actions.setForceImportant({ state, commit: mockCommit, dispatch }, false);

      expect(mockCommit).toBeCalledWith('setForceImportant', false);
      expect(dispatch).toBeCalledWith('applyCss', { css: 'a { color: red; }' });
    });
  });

  describe('applyReadability', () => {
    it('applies to the page, persists the choice and commits the flag', () => {
      actions.applyReadability({ commit: mockCommit, state: mockState }, true);

      expect(mockBridge.applyReadability).toBeCalledWith(true);
      expect(chromeUtils.setReadability).toBeCalledWith(mockState.url, true);
      expect(mockCommit).toBeCalledWith('setReadability', true);
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

  describe('applyFilter', () => {
    const state = {
      ...mockState,
      page: { ...mockState.page, bodyChildSelectors: ['div.a'] },
    };

    beforeEach(() => {
      jest
        .spyOn(stylebotCss, 'getCssAfterApplyingFilterEffectToPage')
        .mockReturnValue('filtered');
    });

    it('reads the page right now when the bridge can', () => {
      const fresh = { ...state.page, bodyChildSelectors: ['div.b'] };
      mockBridge.getSnapshotSync = jest.fn(() => fresh);

      actions.applyFilter(
        { state, commit: mockCommit, dispatch: mockDispatch },
        { effectName: 'grayscale', percent: '50' }
      );

      expect(mockCommit).toBeCalledWith('setPage', fresh);
      expect(stylebotCss.getCssAfterApplyingFilterEffectToPage).toBeCalledWith(
        'grayscale',
        state.css,
        '50',
        ['div.b']
      );
      expect(mockDispatch).toBeCalledWith('applyCss', { css: 'filtered' });
      expect(mockDispatch).not.toBeCalledWith('refreshPage');
      delete mockBridge.getSnapshotSync;
    });

    it('uses the last snapshot and refreshes it otherwise', () => {
      actions.applyFilter(
        { state, commit: mockCommit, dispatch: mockDispatch },
        { effectName: 'grayscale', percent: '50' }
      );

      expect(stylebotCss.getCssAfterApplyingFilterEffectToPage).toBeCalledWith(
        'grayscale',
        state.css,
        '50',
        ['div.a']
      );
      expect(mockDispatch).toBeCalledWith('refreshPage');
      expect(mockDispatch).toBeCalledWith('applyCss', { css: 'filtered' });
    });
  });

  describe('closeStylebot', () => {
    it('hides the in-page panel', () => {
      actions.closeStylebot({ state: mockState, commit: mockCommit });

      expect(mockCommit).toBeCalledWith('setVisible', false);
      expect(chromeUtils.closeEditorWindow).not.toBeCalled();
    });

    it('closes the window for the tab it edits in the window host', () => {
      actions.closeStylebot({
        state: { ...mockState, host: 'window', tabId: 7 },
        commit: mockCommit,
      });

      expect(chromeUtils.closeEditorWindow).toBeCalledWith(7);
      expect(mockCommit).not.toBeCalled();
    });
  });

  describe('refreshPage', () => {
    it('commits the bridge snapshot', async () => {
      const snapshot = { ...mockState.page, readerable: true };
      mockBridge.getSnapshot.mockResolvedValue(snapshot);

      await actions.refreshPage({ commit: mockCommit });

      expect(mockCommit).toBeCalledWith('setPage', snapshot);
    });

    it('keeps the last snapshot when the page cannot answer', async () => {
      mockBridge.getSnapshot.mockRejectedValue(new Error('Page disconnected'));

      await expect(
        actions.refreshPage({ commit: mockCommit })
      ).resolves.toBeUndefined();
      expect(mockCommit).not.toBeCalled();
    });
  });

  describe('openStylebot', () => {
    const getters = { readabilityActive: false } as never;

    it('refreshes the page, re-enables a disabled style and shows the panel', async () => {
      const state = { ...mockState, enabled: false };

      await actions.openStylebot(
        { state, commit: mockCommit, dispatch: mockDispatch, getters },
        { inspect: true }
      );

      expect(mockDispatch).toBeCalledWith('refreshPage');
      expect(chromeUtils.enableStyle).toBeCalledWith(state.url);
      expect(mockCommit).toBeCalledWith('setVisible', true);
      expect(mockCommit).toBeCalledWith('setInspecting', true);
    });

    it('does not start inspecting outside basic mode', async () => {
      const state = {
        ...mockState,
        options: { ...mockState.options, mode: 'code' as const },
      };

      await actions.openStylebot(
        { state, commit: mockCommit, dispatch: mockDispatch, getters },
        { inspect: true }
      );

      expect(mockCommit).not.toBeCalledWith('setInspecting', true);
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
        .mockImplementation((family, css) => `@import ${family};\n${css}`);
      jest.spyOn(stylebotCss, 'googleWebFontExists').mockResolvedValue(false);
    });

    it('applies the declaration, remembers a pick, and imports a bundled font', async () => {
      await actions.applyFontFamily(
        { state, dispatch: mockDispatch },
        { value: 'Inter, sans-serif', remember: true }
      );

      expect(mockDispatch).toHaveBeenNthCalledWith(1, 'applyDeclaration', {
        property: 'font-family',
        value: 'Inter, sans-serif',
      });
      expect(mockDispatch).toHaveBeenNthCalledWith(2, 'rememberFont', 'Inter');
      expect(stylebotCss.googleWebFontExists).not.toBeCalled();
      expect(mockDispatch).toHaveBeenNthCalledWith(3, 'applyCss', {
        css: '@import Inter;\na { }',
      });
    });

    it('does not remember text applied by leaving the field', async () => {
      await actions.applyFontFamily(
        { state, dispatch: mockDispatch },
        { value: 'Inter' }
      );

      expect(mockDispatch).not.toBeCalledWith(
        'rememberFont',
        expect.anything()
      );
    });

    it('checks fonts outside the bundled list before importing', async () => {
      jest.spyOn(stylebotCss, 'googleWebFontExists').mockResolvedValue(true);

      await actions.applyFontFamily(
        { state, dispatch: mockDispatch },
        { value: 'Some Font' }
      );

      expect(stylebotCss.googleWebFontExists).toBeCalledWith('Some Font');
      expect(mockDispatch).toBeCalledWith('applyCss', {
        css: '@import Some Font;\na { }',
      });
    });

    it('leaves the css alone for a font that does not exist', async () => {
      await actions.applyFontFamily(
        { state, dispatch: mockDispatch },
        { value: 'Some Local' }
      );

      expect(stylebotCss.addGoogleWebFontImport).not.toBeCalled();
      expect(mockDispatch).not.toBeCalledWith('applyCss', expect.anything());
    });

    it('adds the import to the css as it is after the lookup, not before', async () => {
      const live = { ...state };
      jest
        .spyOn(stylebotCss, 'googleWebFontExists')
        .mockImplementation(async () => {
          // Another edit lands while the lookup is in flight.
          live.css = 'a { color: red; }';
          return true;
        });

      await actions.applyFontFamily(
        { state: live, dispatch: mockDispatch },
        { value: 'Some Font' }
      );

      expect(mockDispatch).toBeCalledWith('applyCss', {
        css: '@import Some Font;\na { color: red; }',
      });
    });

    it('lets a newer apply win when lookups resolve out of order', async () => {
      let resolveFirst: (exists: boolean) => void = () => undefined;
      jest.spyOn(stylebotCss, 'googleWebFontExists').mockImplementationOnce(
        () =>
          new Promise(resolve => {
            resolveFirst = resolve;
          })
      );

      const first = actions.applyFontFamily(
        { state, dispatch: mockDispatch },
        { value: 'Slow Font' }
      );
      await actions.applyFontFamily(
        { state, dispatch: mockDispatch },
        { value: 'Inter' }
      );
      resolveFirst(true);
      await first;

      expect(stylebotCss.addGoogleWebFontImport).toBeCalledTimes(1);
      expect(stylebotCss.addGoogleWebFontImport).toBeCalledWith(
        'Inter',
        'a { }'
      );
    });

    it('clears the font without remembering or importing anything', async () => {
      await actions.applyFontFamily(
        { state, dispatch: mockDispatch },
        { value: '', remember: true }
      );

      expect(mockDispatch).not.toBeCalledWith(
        'rememberFont',
        expect.anything()
      );
      expect(mockDispatch).toBeCalledWith('applyDeclaration', {
        property: 'font-family',
        value: '',
      });
      expect(stylebotCss.googleWebFontExists).not.toBeCalled();
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

      expect(mockBridge.setPreviewCss).not.toBeCalled();
    });

    it('injects a preview stylesheet with the import for a bundled font', async () => {
      await actions.previewFontFamily({ state }, 'Inter, sans-serif');

      expect(postcss.parse).toBeCalledWith(
        '@import;\nh1 { font-family: Inter, sans-serif; }'
      );
      expect(mockBridge.setPreviewCss).toBeCalledWith(
        '@import;\nh1 { font-family: Inter, sans-serif; }'
      );
    });

    it('skips the import for an unknown font', async () => {
      await actions.previewFontFamily({ state }, 'Some Local');

      expect(postcss.parse).toBeCalledWith('h1 { font-family: Some Local; }');
      expect(stylebotCss.addGoogleWebFontImport).not.toBeCalled();
    });

    it('removes the preview for an empty value', async () => {
      await actions.previewFontFamily({ state }, '');

      expect(mockBridge.setPreviewCss).toBeCalledWith(null);
      expect(mockBridge.setPreviewCss).toBeCalledTimes(1);
    });

    it('drops a preview that was cleared while the font list was loading', async () => {
      let resolveFonts: (fonts: Array<googleFonts.GoogleFont>) => void = () =>
        undefined;
      jest.spyOn(googleFonts, 'loadGoogleFonts').mockImplementation(
        () =>
          new Promise(resolve => {
            resolveFonts = resolve;
          })
      );

      const pending = actions.previewFontFamily({ state }, 'Inter');
      await actions.previewFontFamily({ state }, '');
      resolveFonts([{ family: 'Inter', category: 'sans-serif' }]);
      await pending;

      // Only the clearing call reached the page; the stale preview did not.
      expect(mockBridge.setPreviewCss).toBeCalledTimes(1);
      expect(mockBridge.setPreviewCss).toBeCalledWith(null);
    });

    it('ignores text that is not valid css', async () => {
      jest.spyOn(postcss, 'parse').mockImplementation(() => {
        throw new Error('CssSyntaxError');
      });

      await expect(
        actions.previewFontFamily({ state }, 'Lora }')
      ).resolves.toBeUndefined();
      expect(mockBridge.setPreviewCss).not.toBeCalled();
    });
  });
});
