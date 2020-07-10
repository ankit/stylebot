import * as postcss from 'postcss';
import actions from '../actions';

import mockState from '../__mocks__/state';
import CssUtils from '../../../css/CssUtils';
import * as chromeUtils from '../../utils/chrome';

jest.mock('postcss');
jest.mock('../../utils/chrome');
jest.mock('../../../css/CssUtils');

const mockRoot = {
  some: jest.fn(),
  walkRules: jest.fn(),
  append: jest.fn(),
  toString: jest.fn(),
};

const mockRule = {
  some: jest.fn(),
  append: jest.fn(),
  remove: jest.fn(),
  walkDecls: jest.fn(),
};

const mockDeclaration = {
  prop: 'color',
  value: 'red',
  remove: jest.fn(),
};

const mockCommit = jest.fn();
const mockDispatch = jest.fn();

describe('actions', () => {
  beforeAll(() => {
    CssUtils.injectRootIntoDocument = jest.fn();
    Object.defineProperty(chromeUtils, 'setStyle', { value: jest.fn() });
  });

  beforeEach(() => {
    jest.resetAllMocks();

    Object.defineProperty(postcss, 'parse', {
      value: jest.fn().mockImplementation(() => {
        return mockRoot;
      }),
    });
  });

  describe('applyCss', () => {
    it('does not commit invalid css', () => {
      Object.defineProperty(postcss, 'parse', {
        value: jest.fn().mockImplementation(() => {
          throw new Error();
        }),
      });

      try {
        actions.applyCss(
          { commit: mockCommit, state: mockState },
          { css: 'invalid', shouldSave: true }
        );
      } catch (e) {
        expect(mockCommit).toBeCalledTimes(0);
        expect(chromeUtils.setStyle).toBeCalledTimes(0);
        expect(CssUtils.injectRootIntoDocument).toBeCalledTimes(0);
      }
    });

    it('invokes setSave when shouldSave is true', () => {
      const css = 'a { color: red; }';

      actions.applyCss(
        { commit: mockCommit, state: mockState },
        { css, shouldSave: true }
      );

      expect(mockCommit).toHaveBeenNthCalledWith(1, 'setCss', css);
      expect(mockCommit).toHaveBeenNthCalledWith(2, 'setSelectors', mockRoot);

      expect(chromeUtils.setStyle).toBeCalledWith(mockState.url, css);
      expect(CssUtils.injectRootIntoDocument).toBeCalledWith(mockRoot);
    });

    it('does not invoke setSave when shouldSave is false', () => {
      const css = 'a { color: red; }';

      actions.applyCss(
        { commit: mockCommit, state: mockState },
        { css, shouldSave: false }
      );

      expect(mockCommit).toHaveBeenNthCalledWith(1, 'setCss', css);
      expect(mockCommit).toHaveBeenNthCalledWith(2, 'setSelectors', mockRoot);

      expect(chromeUtils.setStyle).toHaveBeenCalledTimes(0);
      expect(CssUtils.injectRootIntoDocument).toBeCalledWith(mockRoot);
    });
  });

  describe('applyDeclaration', () => {
    describe('append rule', () => {
      it('with proper indentation', () => {
        const state = { ...mockState, activeSelector: 'a' };
        const property = 'color';
        const value = 'red';

        mockRoot.walkRules.mockImplementation((_selector, _callback) => {});
        mockRoot.toString.mockImplementation(() => 'mockToString');

        actions.applyDeclaration(
          { state, dispatch: mockDispatch },
          { property, value }
        );

        expect(mockRoot.append).toBeCalledWith('a {\n  color: red;\n}');
        expect(mockDispatch).toBeCalledWith('applyCss', {
          css: 'mockToString',
        });
      });

      it('with newlines prefixed when there are existing rules', () => {
        const state = { ...mockState, activeSelector: 'a' };
        const property = 'color';
        const value = 'red';

        mockRoot.some.mockImplementation(() => true);
        mockRoot.walkRules.mockImplementation((_selector, _callback) => {});
        mockRoot.toString.mockImplementation(() => 'mockToString');

        actions.applyDeclaration(
          { state, dispatch: mockDispatch },
          { property, value }
        );

        expect(mockRoot.append).toBeCalledWith('\n\na {\n  color: red;\n}');
        expect(mockDispatch).toBeCalledWith('applyCss', {
          css: 'mockToString',
        });
      });

      it('without newlines prefixed when there are no existing rules', () => {
        const state = { ...mockState, activeSelector: 'a' };
        const property = 'color';
        const value = 'red';

        mockRoot.some.mockImplementation(() => false);
        mockRoot.walkRules.mockImplementation((_selector, _callback) => {});
        mockRoot.toString.mockImplementation(() => 'mockToString');

        actions.applyDeclaration(
          { state, dispatch: mockDispatch },
          { property, value }
        );

        expect(mockRoot.append).toBeCalledWith('a {\n  color: red;\n}');
        expect(mockDispatch).toBeCalledWith('applyCss', {
          css: 'mockToString',
        });
      });

      it('does not append new rule when value is empty', () => {
        const state = { ...mockState, activeSelector: 'a' };
        const property = 'color';
        const value = '';

        mockRoot.walkRules.mockImplementation((_selector, _callback) => {});
        mockRoot.toString.mockImplementation(() => 'mockToString');

        actions.applyDeclaration(
          { state, dispatch: mockDispatch },
          { property, value }
        );

        expect(mockRoot.append).toHaveBeenCalledTimes(0);
        expect(mockDispatch).toHaveBeenCalledTimes(0);
      });
    });

    describe('append declaration', () => {
      it('with proper indentation', () => {
        const state = { ...mockState, activeSelector: 'a' };
        const property = 'color';
        const value = 'red';

        mockRoot.walkRules.mockImplementation((_selector, callback) => {
          callback(mockRule);
        });

        mockRule.some.mockImplementation(() => false);
        mockRoot.toString.mockImplementation(() => 'mockToString');

        actions.applyDeclaration(
          { state, dispatch: mockDispatch },
          { property, value }
        );

        expect(mockRoot.append).toHaveBeenCalledTimes(0);
        expect(mockRule.append).toBeCalledWith('\n  color: red;');
        expect(mockDispatch).toBeCalledWith('applyCss', {
          css: 'mockToString',
        });
      });

      it('does not append declaration when value is empty', () => {
        const state = { ...mockState, activeSelector: 'a' };
        const property = 'color';
        const value = '';

        mockRoot.walkRules.mockImplementation((_selector, callback) => {
          callback(mockRule);
        });

        mockRule.some.mockImplementation(() => false);
        mockRoot.toString.mockImplementation(() => 'mockToString');

        actions.applyDeclaration(
          { state, dispatch: mockDispatch },
          { property, value }
        );

        expect(mockRoot.append).toHaveBeenCalledTimes(0);
        expect(mockRule.append).toHaveBeenCalledTimes(0);
        expect(mockDispatch).toHaveBeenCalledTimes(0);
      });
    });

    it('modifies existing declaration with new value', () => {
      const state = { ...mockState, activeSelector: 'a' };
      const property = 'color';
      const value = 'green';

      mockRoot.walkRules.mockImplementation((_selector, callback) => {
        callback(mockRule);
      });

      mockRule.some.mockImplementation(() => true);
      mockRule.walkDecls.mockImplementation((_property, callback) => {
        callback(mockDeclaration);
      });

      mockRoot.toString.mockImplementation(() => 'mockToString');

      actions.applyDeclaration(
        { state, dispatch: mockDispatch },
        { property, value }
      );

      expect(mockRoot.append).toHaveBeenCalledTimes(0);
      expect(mockRule.append).toHaveBeenCalledTimes(0);
      expect(mockDeclaration.value).toEqual('green');
      expect(mockDispatch).toBeCalledWith('applyCss', { css: 'mockToString' });
    });

    it('removes existing declaration if value is empty', () => {
      const state = { ...mockState, activeSelector: 'a' };

      const property = 'color';
      const value = '';

      mockRoot.walkRules.mockImplementation((_selector, callback) => {
        callback(mockRule);
      });

      mockRule.some.mockImplementation(() => true);
      mockRule.walkDecls.mockImplementation((_property, callback) => {
        callback(mockDeclaration);
      });

      mockRoot.toString.mockImplementation(() => 'mockToString');

      actions.applyDeclaration(
        { state, dispatch: mockDispatch },
        { property, value }
      );

      expect(mockRoot.append).toHaveBeenCalledTimes(0);
      expect(mockRule.append).toHaveBeenCalledTimes(0);
      expect(mockRule.remove).toHaveBeenCalledTimes(0);
      expect(mockDeclaration.remove).toHaveBeenCalledTimes(1);

      expect(mockDispatch).toBeCalledWith('applyCss', { css: 'mockToString' });
    });

    it('removes existing rule if empty after declaration removal', () => {
      const state = { ...mockState, activeSelector: 'a' };

      const property = 'color';
      const value = '';

      mockRoot.walkRules.mockImplementation((_selector, callback) => {
        callback(mockRule);
      });

      mockRule.some.mockImplementationOnce(() => true);
      mockRule.walkDecls.mockImplementation((_property, callback) => {
        callback(mockDeclaration);
        mockRule.some.mockImplementationOnce(() => false);
      });

      mockRoot.toString.mockImplementation(() => 'mockToString');

      actions.applyDeclaration(
        { state, dispatch: mockDispatch },
        { property, value }
      );

      expect(mockRoot.append).toHaveBeenCalledTimes(0);
      expect(mockRule.append).toHaveBeenCalledTimes(0);
      expect(mockRule.remove).toHaveBeenCalledTimes(1);
      expect(mockDeclaration.remove).toHaveBeenCalledTimes(1);

      expect(mockDispatch).toBeCalledWith('applyCss', { css: 'mockToString' });
    });
  });
});
