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
  getComputedStyles: jest.fn(),
  getPageOutline: jest.fn(),
  getPageCssContext: jest.fn(),
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
      expect(mockCommit).toHaveBeenNthCalledWith(1, 'setUndoStack', {
        past: [{ css: mockState.css, source: 'edit', at: expect.any(Number) }],
        future: [],
      });
      expect(mockCommit).toHaveBeenNthCalledWith(2, 'setCss', css);
      expect(mockCommit).toHaveBeenNthCalledWith(3, 'setSelectors', mockRoot);
    });

    it('records the css it replaces under the given source', () => {
      const state = { ...mockState, css: 'before' };

      actions.applyCss(
        { commit: mockCommit, state },
        { css: 'after', source: 'code' }
      );

      expect(mockCommit).toBeCalledWith('setUndoStack', {
        past: [{ css: 'before', source: 'code', at: expect.any(Number) }],
        future: [],
      });
    });

    it('extends the latest step when the same source changes the css again right away', () => {
      const undoStack = {
        past: [{ css: 'first', source: 'code', at: Date.now() }],
        future: [],
      };
      const state = { ...mockState, css: 'before', undoStack };

      actions.applyCss(
        { commit: mockCommit, state },
        { css: 'after', source: 'code' }
      );

      expect(mockCommit).toBeCalledWith('setUndoStack', {
        past: [{ css: 'first', source: 'code', at: expect.any(Number) }],
        future: [],
      });
    });

    it('leaves the undo stack alone for a change that is not recorded', () => {
      const state = { ...mockState, css: 'before' };

      actions.applyCss(
        { commit: mockCommit, state },
        { css: 'after', record: false }
      );

      expect(mockCommit).not.toBeCalledWith('setUndoStack', expect.anything());
      expect(mockCommit).toBeCalledWith('setCss', 'after');
    });

    it('leaves the undo stack alone when the css does not change', () => {
      const state = { ...mockState, css: 'same' };

      actions.applyCss({ commit: mockCommit, state }, { css: 'same' });

      expect(mockCommit).not.toBeCalledWith('setUndoStack', expect.anything());
    });
  });

  describe('undo', () => {
    it('re-applies the previous css without recording it, keeping the current one for redo', () => {
      const state = {
        ...mockState,
        css: 'current',
        undoStack: {
          past: [{ css: 'older', source: 'edit', at: 1 }],
          future: [],
        },
      };

      actions.undo({ state, commit: mockCommit, dispatch: mockDispatch });

      expect(mockCommit).toBeCalledWith('setUndoStack', {
        past: [],
        future: [{ css: 'current', source: 'edit', at: 0 }],
      });
      expect(mockDispatch).toBeCalledWith('applyCss', {
        css: 'older',
        record: false,
      });
    });

    it('does nothing with an empty stack', () => {
      actions.undo({
        state: mockState,
        commit: mockCommit,
        dispatch: mockDispatch,
      });

      expect(mockCommit).not.toBeCalled();
      expect(mockDispatch).not.toBeCalled();
    });
  });

  describe('redo', () => {
    it('re-applies the undone css without recording it, keeping the current one for undo', () => {
      const state = {
        ...mockState,
        css: 'current',
        undoStack: {
          past: [],
          future: [{ css: 'newer', source: 'edit', at: 0 }],
        },
      };

      actions.redo({ state, commit: mockCommit, dispatch: mockDispatch });

      expect(mockCommit).toBeCalledWith('setUndoStack', {
        past: [{ css: 'current', source: 'edit', at: 0 }],
        future: [],
      });
      expect(mockDispatch).toBeCalledWith('applyCss', {
        css: 'newer',
        record: false,
      });
    });

    it('does nothing with nothing undone', () => {
      actions.redo({
        state: mockState,
        commit: mockCommit,
        dispatch: mockDispatch,
      });

      expect(mockCommit).not.toBeCalled();
      expect(mockDispatch).not.toBeCalled();
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
      expect(mockDispatch).toBeCalledWith('applyCss', {
        css: 'filtered',
        source: 'filter:grayscale',
      });
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
      expect(mockDispatch).toBeCalledWith('applyCss', {
        css: 'filtered',
        source: 'filter:grayscale',
      });
    });
  });

  describe('closeStylebot', () => {
    it('hides the in-page panel', () => {
      actions.closeStylebot({ state: mockState, commit: mockCommit });

      expect(mockCommit).toBeCalledWith('setVisible', false);
      expect(mockCommit).toBeCalledWith('setUndoStack', {
        past: [],
        future: [],
      });
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
        source: 'declaration:a:color',
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

    it('stops inspecting instead of closing the separate window', () => {
      actions.escape({
        state: { ...mockState, host: 'window', inspecting: true },
        commit: mockCommit,
        dispatch: mockDispatch,
      });

      expect(mockCommit).toBeCalledWith('setInspecting', false);
      expect(mockDispatch).not.toBeCalled();
    });

    it('leaves the separate window open when there is nothing to back out of', () => {
      actions.escape({
        state: { ...mockState, host: 'window', inspecting: false },
        commit: mockCommit,
        dispatch: mockDispatch,
      });

      expect(mockCommit).not.toBeCalled();
      expect(mockDispatch).not.toBeCalled();
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
        .spyOn(googleFonts, 'resolveGoogleFont')
        .mockImplementation(async family =>
          family.toLowerCase() === 'inter' ? 'Inter' : null
        );
      jest
        .spyOn(stylebotCss, 'getPrimaryFontFamily')
        .mockImplementation(value => value.split(',')[0].trim());
      jest
        .spyOn(stylebotCss, 'cleanGoogleWebFonts')
        .mockImplementation(css => css);
      jest
        .spyOn(stylebotCss, 'addGoogleWebFontImport')
        .mockImplementation((family, css) => `@import ${family};\n${css}`);
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
      expect(mockDispatch).toHaveBeenNthCalledWith(3, 'applyCss', {
        css: '@import Inter;\na { }',
        record: false,
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

    it('imports a font under its Google Fonts spelling', async () => {
      await actions.applyFontFamily(
        { state, dispatch: mockDispatch },
        { value: 'inter' }
      );

      expect(googleFonts.resolveGoogleFont).toBeCalledWith('inter');
      expect(mockDispatch).toBeCalledWith('applyCss', {
        css: '@import Inter;\na { }',
        record: false,
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
        .spyOn(googleFonts, 'resolveGoogleFont')
        .mockImplementation(async family => {
          // Another edit lands while the lookup is in flight.
          live.css = 'a { color: red; }';
          return family;
        });

      await actions.applyFontFamily(
        { state: live, dispatch: mockDispatch },
        { value: 'Some Font' }
      );

      expect(mockDispatch).toBeCalledWith('applyCss', {
        css: '@import Some Font;\na { color: red; }',
        record: false,
      });
    });

    it('lets a newer apply win when lookups resolve out of order', async () => {
      let resolveFirst: (family: string) => void = () => undefined;
      jest.spyOn(googleFonts, 'resolveGoogleFont').mockImplementationOnce(
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
      resolveFirst('Slow Font');
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
      expect(googleFonts.resolveGoogleFont).not.toBeCalled();
      expect(stylebotCss.addGoogleWebFontImport).not.toBeCalled();
    });
  });

  describe('previewFontFamily', () => {
    const state = { ...mockState, activeSelector: 'h1' };

    beforeEach(() => {
      jest
        .spyOn(googleFonts, 'resolveGoogleFont')
        .mockImplementation(async family =>
          ['inter', 'zen kurenaido'].includes(family.toLowerCase())
            ? family
            : null
        );
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
      expect(mockBridge.setPreviewCss).toBeCalledWith({
        css: '@import;\nh1 { font-family: Inter, sans-serif; }',
        forceImportant: true,
      });
    });

    it('previews unforced when the style has Override site styles off', async () => {
      await actions.previewFontFamily(
        { state: { ...state, forceImportant: false } },
        'Some Local'
      );

      expect(mockBridge.setPreviewCss).toBeCalledWith({
        css: 'h1 { font-family: Some Local; }',
        forceImportant: false,
      });
    });

    it('imports a Google font outside the bundled list', async () => {
      await actions.previewFontFamily({ state }, 'Zen Kurenaido');

      expect(stylebotCss.addGoogleWebFontImport).toBeCalledWith(
        'Zen Kurenaido',
        'h1 { font-family: Zen Kurenaido; }'
      );
      expect(mockBridge.setPreviewCss).toBeCalledWith({
        css: '@import;\nh1 { font-family: Zen Kurenaido; }',
        forceImportant: true,
      });
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

    it('drops a preview that was cleared while the font was resolving', async () => {
      let resolveFont: (family: string) => void = () => undefined;
      jest.spyOn(googleFonts, 'resolveGoogleFont').mockImplementation(
        () =>
          new Promise(resolve => {
            resolveFont = resolve;
          })
      );

      const pending = actions.previewFontFamily({ state }, 'Inter');
      await actions.previewFontFamily({ state }, '');
      resolveFont('Inter');
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

  describe('refreshComputedStyles', () => {
    it('reads the placeholder properties for the active selector', async () => {
      const state = { ...mockState, activeSelector: 'h1' };
      mockBridge.getComputedStyles.mockResolvedValue({ 'font-size': '16px' });

      await actions.refreshComputedStyles({ commit: mockCommit, state });

      expect(mockBridge.getComputedStyles).toBeCalledWith(
        'h1',
        expect.arrayContaining(['font-size', 'padding-top'])
      );
      expect(mockCommit).toBeCalledWith('setComputedStyles', {
        'font-size': '16px',
      });
    });

    it('clears them without asking the page when nothing is selected', async () => {
      await actions.refreshComputedStyles({
        commit: mockCommit,
        state: mockState,
      });

      expect(mockBridge.getComputedStyles).not.toBeCalled();
      expect(mockCommit).toBeCalledWith('setComputedStyles', {});
    });

    it('drops a read overtaken by a newer one', async () => {
      const state = { ...mockState, activeSelector: 'h1' };
      let resolveFirst: (styles: Record<string, string>) => void = () =>
        undefined;
      mockBridge.getComputedStyles
        .mockReturnValueOnce(new Promise(resolve => (resolveFirst = resolve)))
        .mockResolvedValueOnce({ 'font-size': '20px' });

      const first = actions.refreshComputedStyles({
        commit: mockCommit,
        state,
      });
      await actions.refreshComputedStyles({ commit: mockCommit, state });
      resolveFirst({ 'font-size': '16px' });
      await first;

      expect(mockCommit).toBeCalledTimes(1);
      expect(mockCommit).toBeCalledWith('setComputedStyles', {
        'font-size': '20px',
      });
    });
  });
});
