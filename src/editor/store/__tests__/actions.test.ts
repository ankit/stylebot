import * as postcss from 'postcss';
import actions from '../actions';

import mockState from '../__mocks__/state';
import * as stylebotCss from '@stylebot/css';
import * as stylebotReadability from '@stylebot/readability';
import * as chromeUtils from '../../utils/chrome';
import { readCache, writeCache } from '../../../inject-css/cache';

jest.mock('postcss');
jest.mock('@stylebot/css');
jest.mock('@stylebot/readability');
jest.mock('../../utils/chrome');

const mockRoot = ({
  some: jest.fn(),
  walkRules: jest.fn(),
  append: jest.fn(),
  toString: jest.fn(),
} as never) as postcss.Root;

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
          { url: 'other.example.com', css: 'b { color: green; }', enabled: true },
        ],
        readability: false,
      });

      actions.applyCss({ commit: mockCommit, state: mockState }, { css });

      expect(readCache()).toEqual({
        styles: [
          { url: mockState.url, css, enabled: mockState.enabled },
          { url: 'other.example.com', css: 'b { color: green; }', enabled: true },
        ],
        readability: false,
      });
    });

    it('appends a cached style if none exists yet for this url', () => {
      const css = 'a { color: red; }';
      jest.spyOn(stylebotCss, 'removeEmptyRules').mockReturnValue(css);

      writeCache({
        styles: [
          { url: 'other.example.com', css: 'b { color: green; }', enabled: true },
        ],
        readability: false,
      });

      actions.applyCss({ commit: mockCommit, state: mockState }, { css });

      expect(readCache()).toEqual({
        styles: [
          { url: 'other.example.com', css: 'b { color: green; }', enabled: true },
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
        styles: [{ url: mockState.url, css: 'a { color: blue; }', enabled: true }],
        readability: false,
      });

      actions.applyReadability({ commit: mockCommit, state: mockState }, true);

      expect(readCache()).toEqual({
        styles: [{ url: mockState.url, css: 'a { color: blue; }', enabled: true }],
        readability: true,
      });
      expect(stylebotReadability.apply).toBeCalledWith(true);
      expect(chromeUtils.setReadability).toBeCalledWith(mockState.url, true);
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
});
